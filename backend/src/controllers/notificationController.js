import Notification from '../models/Notification.js';

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

    // 2. Emit Real-time event (to recipient's room)
    // Populate sender details so the UI looks good immediately
    const populatedNotif = await newNotif.populate('sender', 'name profilePicture');
    
    io.to(recipientId).emit("new_notification", populatedNotif);
    
    return newNotif;
  } catch (err) {
    console.error("Notification Error:", err);
  }
};

// API: Get User's Notifications
const getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .populate('sender', 'name profilePicture')
      .limit(20);
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
    const io = req.app.get('io'); // Get Socket Instance

    // Create Entry
    const newNotif = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type, // e.g., 'connection_request'
      message,
      link
    });

    // Populate Sender Details for UI
    const populatedNotif = await newNotif.populate('sender', 'name profilePicture');

    // Emit Real-time Event to Recipient
    if (io) {
      io.to(recipientId).emit("new_notification", populatedNotif);
    }

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
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
};

export { createNotification, getNotifications, markRead, sendNotificationAPI };