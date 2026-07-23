import express from 'express';
import { getNotifications, markRead, sendNotificationAPI } from '../controllers/notificationController.js';
const router = express.Router();
import { protect } from '../middlewares/authMiddleware.js';
router.get('/', protect, getNotifications);
router.put('/mark-read', protect, markRead);
router.post('/', protect, sendNotificationAPI);

export default router;