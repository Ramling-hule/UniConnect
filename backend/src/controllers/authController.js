import User from "../models/User.js";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // or your SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1. REGISTER: Create User (Unverified) & Send Email
export const registerUser = async (req, res) => {
  try {
    const { name, username, institute, email, password } = req.body;

    // Check existing
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Generate 4-digit Code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedCode = await bcrypt.hash(code, 10); // Hash code for security

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User (Marked as NOT Verified)
    const newUser = new User({
      name,
      username,
      institute,
      email,
      password: password,
      isVerified: false, 
      verificationCode: hashedCode,
      verificationCodeExpires: Date.now() + 10 * 60 * 1000, // 10 mins expiry
    });

    await newUser.save();

    // Send Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}`,
      html: `<b>Your verification code is: ${code}</b>`,
    });

    // Return userId so frontend knows who to verify in step 2
    res.status(201).json({ message: "Code sent", userId: newUser._id });

  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error.message);
    
  }
};

// 2. VERIFY: Check Code & Finalize Login
export const verifyEmail = async (req, res) => {
  try {
    const { userId, code } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    // Check Expiry
    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: "Code expired" });
    }

    // Check Code Match
    const isMatch = await bcrypt.compare(code, user.verificationCode);
    if (!isMatch) return res.status(400).json({ message: "Invalid code" });

    // Mark Verified & Clean up
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Generate JWT Token (Login the user)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    // Return User Data & Token
    const { password, ...others } = user._doc;
    res.status(200).json({ user: others, token });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      // Set token in httpOnly cookie as well
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        institute: user.institute,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};