import Notification from '../models/Notification.js';
// 👇 REDIS IMPORT
import redisClient from '../config/redis.js';

// Helper to Create & Emit
const createNotification = async (io, { recipientId, senderId, type, message, link }) => {
  try {
    // 1. Save to DB
    const newNotif = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      link
    });

    // 2. Emit Real-time event
    const populatedNotif = await newNotif.populate('sender', 'name profilePicture');
    
    if (io) {
        io.to(recipientId).emit("new_notification", populatedNotif);
    }

    // 👇 INVALIDATE CACHE
    // The recipient has a new notification, so their cached list is outdated.
    await redisClient.del(`notifications:${recipientId}`);
    
    return newNotif;
  } catch (err) {
    console.error("Notification Error:", err);
  }
};

// API: Get User's Notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // 👇 CHECK CACHE
    const cachedNotifs = await redisClient.get(`notifications:${userId}`);
    if (cachedNotifs) {
        return res.json(JSON.parse(cachedNotifs));
    }

    const notifs = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'name profilePicture')
      .limit(20);

    // 👇 SAVE CACHE (Short TTL, e.g., 5 mins)
    await redisClient.setEx(`notifications:${userId}`, 300, JSON.stringify(notifs));

    res.json(notifs);
  } catch (err) {
    res.status(500).json(err);
  }
};

// 1. NEW: API Handler to Create Notification manually
const sendNotificationAPI = async (req, res) => {
  const { recipientId, type, message, link } = req.body;
  const senderId = req.user.id;

  try {
    const io = req.app.get('io'); 

    const newNotif = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type, 
      message,
      link
    });

    const populatedNotif = await newNotif.populate('sender', 'name profilePicture');

    if (io) {
      io.to(recipientId).emit("new_notification", populatedNotif);
    }

    // 👇 INVALIDATE CACHE
    await redisClient.del(`notifications:${recipientId}`);

    res.status(201).json(populatedNotif);
  } catch (err) {
    console.error("Notif Create Error:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
};

// API: Mark as Read
const markRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    // 👇 INVALIDATE CACHE
    // The "isRead" status changed, so the cached list is wrong.
    await redisClient.del(`notifications:${req.user.id}`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
};

export { createNotification, getNotifications, markRead, sendNotificationAPI };