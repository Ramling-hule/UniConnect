import express from 'express';
import { getNotifications, markRead, sendNotificationAPI } from '../controllers/notificationController.js';
const router = express.Router();

// Middleware to check if user is logged in
// Ensure this points to wherever your 'verifyToken' middleware is located
import { protect } from '../middlewares/authMiddleware.js';

// GET /api/notifications - Get all for current user
router.get('/', protect, getNotifications);

// PUT /api/notifications/mark-read - Mark all as read
router.put('/mark-read', protect, markRead);
router.post('/', protect, sendNotificationAPI);

export default router;