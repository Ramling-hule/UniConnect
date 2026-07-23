import Notification from '../models/Notification.js';
import redisClient from '../config/redis.js';

class NotificationService {
  constructor() {
    this.observers = [];
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  async notify(notificationData, io) {
    const results = {};
    for (const observer of this.observers) {
      try {
        const result = await observer.update(notificationData, io);
        results[observer.constructor.name] = result;
      } catch (err) {
        console.error(`[Observer Error] ${observer.constructor.name} failed:`, err);
      }
    }
    return results;
  }
}
class DbNotificationObserver {
  async update(data) {
    const newNotif = await Notification.create({
      recipient: data.recipientId,
      sender: data.senderId,
      type: data.type,
      message: data.message,
      link: data.link,
      relatedId: data.relatedId
    });
    return newNotif;
  }
}
class RedisNotificationObserver {
  async update(data) {
    try {
      if (redisClient.isReady) {
        await redisClient.del(`notifications:${data.recipientId}`);
      }
    } catch (err) {
      console.warn('⚠️  Redis cache invalidation failed:', err.message);
    }
    return true;
  }
}
class SocketNotificationObserver {
  async update(data, io) {
    if (!io) return null;
    const notif = await Notification.findOne({
      recipient: data.recipientId,
      sender: data.senderId,
      type: data.type,
      message: data.message,
      link: data.link,
      relatedId: data.relatedId
    }).sort({ createdAt: -1 }).populate('sender', 'name profilePicture');

    if (notif) {
      io.to(data.recipientId.toString()).emit('new_notification', notif);
      return true;
    }
    return false;
  }
}
const notificationManager = new NotificationService();
notificationManager.subscribe(new DbNotificationObserver());
notificationManager.subscribe(new RedisNotificationObserver());
notificationManager.subscribe(new SocketNotificationObserver());

export default notificationManager;
