import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import EmailService from "./EmailService.js";
import CacheService from "./CacheService.js";

const sha256 = (plainText) => crypto.createHash("sha256").update(plainText).digest("hex");

class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        version: user.tokenVersion || 1 
      },
      env.jwtSecret,
      { 
        expiresIn: "15m",
        issuer: "uniconnect-api",
        audience: "uniconnect-client",
        jwtid: crypto.randomUUID()
      }
    );
  }

  async register({ name, username, institute, email, password }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("User already exists");
      error.status = 400;
      throw error;
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = sha256(otp);

    const newUser = new User({
      name,
      username,
      institute,
      email,
      password,
      isVerified: false,
      verificationOtpHash: otpHash,
      verificationOtpExpires: Date.now() + 10 * 60 * 1000,
      verificationAttempts: 0
    });

    await newUser.save();
    await EmailService.sendOtpEmail(email, otp);

    return newUser._id;
  }

  async verifyEmail({ userId, code }) {
    const user = await User.findById(userId);
    if (!user) throw { status: 400, message: "User not found" };
    if (user.isVerified) throw { status: 400, message: "User already verified" };

    if (user.verificationAttempts >= 5) {
      throw { status: 400, message: "Too many failed verification attempts. Please register again.", code: "MAX_ATTEMPTS" };
    }

    if (user.verificationCode && user.verificationCodeExpires) {
      const bcrypt = await import("bcryptjs");
      if (user.verificationCodeExpires < Date.now()) throw { status: 400, message: "Verification code expired" };
      const isMatch = await bcrypt.default.compare(code, user.verificationCode);
      if (!isMatch) {
        user.verificationAttempts += 1;
        await user.save();
        throw { status: 400, message: "Invalid code" };
      }
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
    } else {
      if (!user.verificationOtpExpires || user.verificationOtpExpires < Date.now()) throw { status: 400, message: "Verification OTP expired" };
      const hashedInput = sha256(code);
      if (hashedInput !== user.verificationOtpHash) {
        user.verificationAttempts += 1;
        await user.save();
        throw { status: 400, message: "Invalid OTP" };
      }
      user.verificationOtpHash = undefined;
      user.verificationOtpExpires = undefined;
    }

    user.isVerified = true;
    user.verificationAttempts = 0;
    await user.save();

    return user;
  }

  async login({ email, password, deviceInfo }) {
    const user = await User.findOne({ email });
    if (!user) throw { status: 401, message: "Invalid email or password" };

    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      const remaining = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      throw { status: 423, message: `Account is locked. Please try again in ${remaining} minutes.` };
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = Date.now() + 15 * 60 * 1000;
        await user.save();
        throw { status: 401, message: "Invalid email or password", locked: true, userId: user._id };
      }
      await user.save();
      throw { status: 401, message: "Invalid email or password", userId: user._id };
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();

    const sessionId = crypto.randomUUID();
    const accessToken = this.generateAccessToken(user);
    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const refreshHash = sha256(rawRefreshToken);

    await RefreshToken.create({
      user: user._id,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deviceInfo
    });

    await CacheService.setSession(user._id, sessionId, 30 * 24 * 60 * 60, {
      tokenVersion: user.tokenVersion || 1,
      ip: deviceInfo.ipAddress
    });

    return { user, accessToken, rawRefreshToken, sessionId };
  }

  async rotateRefreshToken(rawToken, deviceInfo) {
    if (!rawToken) throw { status: 401, message: "Refresh token required" };

    const tokenHash = sha256(rawToken);
    const tokenDoc = await RefreshToken.findOne({ tokenHash }).populate("user");
    if (!tokenDoc) throw { status: 401, message: "Invalid refresh token" };

    const user = tokenDoc.user;

    if (tokenDoc.isUsed || tokenDoc.isRevoked) {
      await RefreshToken.deleteMany({ user: user._id });
      await CacheService.deleteSession(user._id);
      throw { status: 401, message: "Security threat detected. Sessions invalidated.", reuseAttempt: true, user, tokenHash };
    }

    if (tokenDoc.expiresAt < Date.now()) throw { status: 401, message: "Expired refresh token" };

    tokenDoc.isUsed = true;
    await tokenDoc.save();

    const newAccessToken = this.generateAccessToken(user);
    const newRawRefreshToken = crypto.randomBytes(40).toString("hex");
    const newRefreshHash = sha256(newRawRefreshToken);

    await RefreshToken.create({
      user: user._id,
      tokenHash: newRefreshHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      parentTokenHash: tokenHash,
      deviceInfo
    });

    return { user, newAccessToken, newRawRefreshToken };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) return null; // Prevent enumeration

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hash = sha256(resetToken);

    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${env.clientUrl}/reset-password?token=${resetToken}&userId=${user._id}`;
    await EmailService.sendPasswordResetEmail(email, resetUrl);
    
    return user;
  }

  async resetPassword({ userId, token, password }) {
    const user = await User.findById(userId);
    if (!user) throw { status: 400, message: "Invalid request" };

    if (!user.passwordResetTokenHash || user.passwordResetExpires < Date.now()) {
      throw { status: 400, message: "Reset token expired or invalid" };
    }

    const tokenHash = sha256(token);
    if (tokenHash !== user.passwordResetTokenHash) {
      throw { status: 400, message: "Invalid reset token" };
    }

    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.tokenVersion = (user.tokenVersion || 1) + 1;
    await user.save();

    await RefreshToken.deleteMany({ user: user._id });
    await CacheService.deleteSession(user._id);

    return user;
  }

  async logout(rawToken, ip) {
    if (rawToken) {
      const hash = sha256(rawToken);
      const tokenDoc = await RefreshToken.findOneAndDelete({ tokenHash: hash });
      if (tokenDoc) {
        await CacheService.deleteSessionByIp(tokenDoc.user, ip);
        return tokenDoc.user;
      }
    }
    return null;
  }

  async logoutAllDevices(userId) {
    await RefreshToken.deleteMany({ user: userId });
    const user = await User.findById(userId);
    if (user) {
      user.tokenVersion = (user.tokenVersion || 1) + 1;
      await user.save();
    }
    await CacheService.deleteSession(userId);
  }
}

export default new AuthService();
