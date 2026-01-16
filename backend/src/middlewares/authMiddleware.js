import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  console.log("--- Auth Debug Start ---");
  console.log("1. Header received:", req.headers.authorization);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log("2. Token extracted:", token);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("3. Token decoded:", decoded);

      // Check User
      req.user = await User.findById(decoded.id).select('-password');
      console.log("4. User found in DB:", req.user ? "Yes" : "No");

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error("!!! Auth Error:", error.message);
      // Helpful for debugging expiration vs invalid signature
      res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
  } else {
      console.log("No Bearer token found in header");
      res.status(401).json({ message: 'Not authorized, no token' });
  }
};