import redisClient from "../config/redis.js";

class CacheService {
  async setSession(userId, sessionId, ttlSeconds, payload) {
    if (!redisClient.isReady) return;
    try {
      await redisClient.setEx(
        `session:active:${userId}:${sessionId}`,
        ttlSeconds,
        JSON.stringify(payload)
      );
    } catch (err) {
      console.error("Redis setSession error:", err.message);
    }
  }

  async deleteSession(userId, sessionId = "*") {
    if (!redisClient.isReady) return;
    try {
      const keys = await redisClient.keys(`session:active:${userId}:${sessionId}`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (err) {
      console.error("Redis deleteSession error:", err.message);
    }
  }

  async deleteSessionByIp(userId, ip) {
    if (!redisClient.isReady) return;
    try {
      const keys = await redisClient.keys(`session:active:${userId}:*`);
      for (const key of keys) {
        const sessionData = await redisClient.get(key);
        if (sessionData && JSON.parse(sessionData).ip === ip) {
          await redisClient.del(key);
        }
      }
    } catch (err) {
      console.error("Redis deleteSessionByIp error:", err.message);
    }
  }
}

export default new CacheService();
