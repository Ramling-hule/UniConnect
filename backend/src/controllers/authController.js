import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};


export const registerUser = async (req, res) => {
  const { name, email, password, username, institute } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // In a real app, we would send an OTP email here.
    // For now, we will assume auto-verification or just create the user.
    
    const user = await User.create({
      name,
      email,
      password,
      username,
      institute,
    });

    if (user) {
      // Create Session in Redis (Optional: whitelist specific session)
      // await redis.set(`session:${user._id}`, 'active', 'EX', 604800); 

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        institute: user.institute,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error);
    
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        institute: user.institute,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};