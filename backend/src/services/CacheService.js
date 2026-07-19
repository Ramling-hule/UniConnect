import redisClient from '../config/redis.js';

/**
 * CacheService — Facade over Redis.
 *
 * SOLID applied:
 *  - SRP : one class owns all cache interaction; callers never touch redisClient directly.
 *  - OCP : new capabilities (locks, domain caches) are added by extending this class,
 *          not by patching callers.
 *  - DIP : controllers/services depend on this abstraction, not on `redisClient` directly.
 *
 * Exposes the raw redisClient only as a readonly property for cases (e.g., connect-redis)
 * that specifically require the client object — but that should be the exception, not the rule.
 */
class CacheService {
  // ── Internal client access ────────────────────────────────────────────────────

  /** @readonly — use only when a library requires the raw Redis client (e.g. connect-redis). */
  get redisClient() {
    return redisClient;
  }

  // ── Session management ────────────────────────────────────────────────────────

  async setSession(userId, sessionId, ttlSeconds, payload) {
    if (!redisClient.isReady) return;
    try {
      await redisClient.setEx(
        `session:active:${userId}:${sessionId}`,
        ttlSeconds,
        JSON.stringify(payload),
      );
    } catch (err) {
      console.error('Redis setSession error:', err.message);
    }
  }

  async deleteSession(userId, sessionId = '*') {
    if (!redisClient.isReady) return;
    try {
      const keys = await redisClient.keys(`session:active:${userId}:${sessionId}`);
      if (keys.length > 0) await redisClient.del(keys);
    } catch (err) {
      console.error('Redis deleteSession error:', err.message);
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
      console.error('Redis deleteSessionByIp error:', err.message);
    }
  }

  // ── Distributed locking ───────────────────────────────────────────────────────

  /**
   * Acquires a distributed lock using Redis NX (set-if-not-exists).
   *
   * @param {string} key         - Unique lock key (e.g. `booking_lock:mentorId:date:time`)
   * @param {string} value       - Unique value to identify the lock holder (e.g. UUID)
   * @param {number} ttlSeconds  - Lock expiry in seconds
   * @returns {Promise<boolean>}  true if lock acquired, false if already held
   */
  async acquireLock(key, value, ttlSeconds) {
    if (!redisClient.isReady) {
      // If Redis is down, allow the operation to proceed (fail-open).
      // Adjust to fail-closed if your use-case requires strict consistency.
      return true;
    }
    try {
      const result = await redisClient.set(key, value, { NX: true, EX: ttlSeconds });
      return result === 'OK';
    } catch (err) {
      console.error('Redis acquireLock error:', err.message);
      return true; // fail-open
    }
  }

  /**
   * Releases a distributed lock by deleting its key.
   * @param {string} key
   */
  async releaseLock(key) {
    if (!redisClient.isReady) return;
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error('Redis releaseLock error:', err.message);
    }
  }

  // ── Generic get/set/del helpers ───────────────────────────────────────────────

  /**
   * Gets a cached JSON value. Returns null on miss or Redis error.
   * @param {string} key
   * @returns {Promise<any|null>}
   */
  async get(key) {
    if (!redisClient.isReady) return null;
    try {
      const raw = await redisClient.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Redis get error:', err.message);
      return null;
    }
  }

  /**
   * Sets a JSON value with a TTL.
   * @param {string} key
   * @param {any}    value
   * @param {number} ttlSeconds
   */
  async set(key, value, ttlSeconds) {
    if (!redisClient.isReady) return;
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.warn('Redis set error:', err.message);
    }
  }

  /**
   * Deletes one or more keys.
   * @param {...string} keys
   */
  async del(...keys) {
    if (!redisClient.isReady) return;
    try {
      await redisClient.del(keys);
    } catch (err) {
      console.warn('Redis del error:', err.message);
    }
  }
}

export default new CacheService();
