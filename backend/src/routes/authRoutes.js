import express from 'express';
import { 
  registerUser, 
  loginUser, 
  verifyEmail, 
  rotateRefreshToken, 
  forgotPassword, 
  resetPassword, 
  logoutUser, 
  logoutAllDevices 
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { loginLimiter, registrationLimiter } from '../middlewares/rateLimiter.js';
import { validateRegister, validateResetPassword } from '../middlewares/validator.js';

const router = express.Router();

router.post('/register', registrationLimiter, validateRegister, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/verify-email', verifyEmail);
router.post('/refresh-token', rotateRefreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.post('/logout', logoutUser);
router.post('/logout-all', protect, logoutAllDevices);

export default router;