import AuthService from "../services/AuthService.js";
import AuditService from "../services/AuditService.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

const getDeviceInfo = (req) => ({
  ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  userAgent: req.headers["user-agent"]
});

// 1. REGISTER
export const registerUser = asyncHandler(async (req, res, next) => {
  try {
    const userId = await AuthService.register(req.body);
    await AuditService.log(userId, "REGISTRATION_SUCCESS", req);
    res.status(201).json({ message: "Verification OTP sent", userId });
  } catch (error) {
    if (error.status === 400 && error.message === "User already exists") {
      await AuditService.log(null, "REGISTRATION_ATTEMPT", req, { email: req.body.email, reason: "Email already exists" });
    }
    return next(new AppError(error.message, error.status || 500));
  }
});

// 2. VERIFY
export const verifyEmail = asyncHandler(async (req, res, next) => {
  try {
    const user = await AuthService.verifyEmail(req.body);
    await AuditService.log(user._id, "EMAIL_VERIFICATION_SUCCESS", req);
    res.status(200).json({ message: "Account verified successfully. Please login." });
  } catch (error) {
    return next(new AppError(error.message, error.status || 500));
  }
});

// 3. LOGIN
export const loginUser = asyncHandler(async (req, res, next) => {
  try {
    const deviceInfo = getDeviceInfo(req);
    const result = await AuthService.login({ ...req.body, deviceInfo });

    // Set secure HTTP-Only cookie
    res.cookie("refreshToken", result.rawRefreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "lax",
      path: "/api/auth/refresh-token",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    await AuditService.log(result.user._id, "LOGIN_SUCCESS", req, { sessionId: result.sessionId });

    res.json({
      accessToken: result.accessToken,
      user: {
        _id: result.user._id,
        name: result.user.name,
        username: result.user.username,
        email: result.user.email,
        institute: result.user.institute,
      }
    });
  } catch (error) {
    if (error.userId) {
      await AuditService.log(error.userId, "LOGIN_FAILURE", req);
      if (error.locked) {
        await AuditService.log(error.userId, "ACCOUNT_LOCKOUT", req);
      }
    }
    return next(new AppError(error.message, error.status || 500));
  }
});

// 4. REFRESH TOKEN ROTATION
export const rotateRefreshToken = asyncHandler(async (req, res, next) => {
  const rawToken = req.cookies?.refreshToken;
  const deviceInfo = getDeviceInfo(req);

  try {
    const result = await AuthService.rotateRefreshToken(rawToken, deviceInfo);

    res.cookie("refreshToken", result.newRawRefreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "lax",
      path: "/api/auth/refresh-token",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    await AuditService.log(result.user._id, "REFRESH_TOKEN_SUCCESS", req);
    res.json({ accessToken: result.newAccessToken });

  } catch (error) {
    if (error.reuseAttempt) {
      await AuditService.log(error.user._id, "REFRESH_TOKEN_REUSE_ATTEMPT", req, { tokenHash: error.tokenHash });
      res.clearCookie("refreshToken");
    }
    return next(new AppError(error.message, error.status || 500));
  }
});

// 5. FORGOT PASSWORD
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await AuthService.forgotPassword(req.body.email);
  if (user) {
    await AuditService.log(user._id, "PASSWORD_RESET_REQUESTED", req);
  }
  // Always return success to prevent email enumeration
  res.status(200).json({ message: "If that email exists, a reset link has been sent." });
});

// 6. RESET PASSWORD
export const resetPassword = asyncHandler(async (req, res, next) => {
  try {
    const user = await AuthService.resetPassword(req.body);
    await AuditService.log(user._id, "PASSWORD_RESET_COMPLETED", req);
    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    return next(new AppError(error.message, error.status || 500));
  }
});

// 7. LOGOUT (SINGLE DEVICE)
export const logoutUser = asyncHandler(async (req, res, next) => {
  const userId = await AuthService.logout(req.cookies?.refreshToken, req.ip);
  if (userId) {
    await AuditService.log(userId, "LOGOUT_SUCCESS", req);
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

// 8. LOGOUT ALL DEVICES
export const logoutAllDevices = asyncHandler(async (req, res, next) => {
  await AuthService.logoutAllDevices(req.user._id);
  res.clearCookie("refreshToken");
  await AuditService.log(req.user._id, "LOGOUT_ALL_DEVICES", req);
  res.json({ message: "Logged out from all devices" });
});