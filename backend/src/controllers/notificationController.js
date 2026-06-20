import Notification from '../models/Notification.js';
import redisClient from '../config/redis.js';
import notificationManager from '../services/notificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

// Helper to Create & Emit
const createNotification = async (io, { recipientId, senderId, type, message, link }) => {
  try {
    const results = await notificationManager.notify({
      recipientId,
      senderId,
      type,
      message,
      link
    }, io);
    return results.DbNotificationObserver;
  } catch (err) {
    console.error("Notification Error:", err);
  }
};

// API: Get User's Notifications
const getNotifications = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  let cachedNotifs = null;

  try {
    if (redisClient.isReady) {
      cachedNotifs = await redisClient.get(`notifications:${userId}`);
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache read:', redisErr.message);
  }

  if (cachedNotifs) {
      return res.json(JSON.parse(cachedNotifs));
  }

  const notifs = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .populate('sender', 'name profilePicture')
    .limit(20);

  try {
    if (redisClient.isReady) {
      await redisClient.setEx(`notifications:${userId}`, 300, JSON.stringify(notifs));
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache write:', redisErr.message);
  }

  res.json(notifs);
});

// 1. NEW: API Handler to Create Notification manually
const sendNotificationAPI = asyncHandler(async (req, res, next) => {
  const { recipientId, type, message, link } = req.body;
  const senderId = req.user.id;

  const io = req.app.get('io'); 

  const results = await notificationManager.notify({
    recipientId,
    senderId,
    type,
    message,
    link
  }, io);

  const populatedNotif = await results.DbNotificationObserver?.populate('sender', 'name profilePicture');
  res.status(201).json(populatedNotif);
});

// API: Mark as Read
const markRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { $set: { isRead: true } }
  );

  try {
    if (redisClient.isReady) {
      await redisClient.del(`notifications:${req.user.id}`);
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache invalidation:', redisErr.message);
  }

  res.json({ success: true });
});

export { createNotification, getNotifications, markRead, sendNotificationAPI };