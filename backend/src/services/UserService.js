import User from '../models/User.js';
import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';

/**
 * UserService — Single Responsibility: User profile management.
 *
 * Design patterns applied:
 *  - Service Layer (SRP): Profile business logic separated from HTTP concerns.
 *  - Facade: Wraps Redis cache access with graceful fallback — consumers don't
 *    need to know whether the cache is available.
 */
class UserService {
  // ── Cache helpers ────────────────────────────────────────────────────────────

  async _getCached(key) {
    try {
      if (redisClient.isReady) return await redisClient.get(key);
    } catch (err) {
      logger.warn('Redis unavailable, skipping cache read', { key, err: err.message });
    }
    return null;
  }

  async _setCached(key, value, ttlSeconds) {
    try {
      if (redisClient.isReady) await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      logger.warn('Redis unavailable, skipping cache write', { key, err: err.message });
    }
  }

  async _delCached(key) {
    try {
      if (redisClient.isReady) await redisClient.del(key);
    } catch (err) {
      logger.warn('Redis unavailable, skipping cache invalidation', { key, err: err.message });
    }
  }

  // ── Public interface ─────────────────────────────────────────────────────────

  /**
   * Returns a user's public profile, using a 1-hour Redis cache.
   * @param {string} username
   * @returns {Promise<User>}
   */
  async getUserByUsername(username) {
    const cacheKey = `profile:${username}`;
    const cached = await this._getCached(cacheKey);
    if (cached) return JSON.parse(cached);

    const user = await User.findOne({ username }).select('-password');
    if (!user) throw new AppError('User not found', 404);

    await this._setCached(cacheKey, user, 3600);
    return user;
  }

  /**
   * Updates a user's profile, invalidating their Redis cache entry.
   * @param {string} userId
   * @param {object} updates  - Fields to update (password/email/role/_id are stripped)
   * @returns {Promise<User>}
   */
  async updateProfile(userId, updates) {
    // Strip protected fields — never allow clients to escalate privileges
    const safe = { ...updates };
    ['password', 'email', 'role', '_id'].forEach((k) => delete safe[k]);

    const user = await User.findByIdAndUpdate(userId, safe, { new: true }).select('-password');

    if (user?.username) {
      await this._delCached(`profile:${user.username}`);
    }

    return user;
  }

  /**
   * Returns suggested users that the current user is not already following.
   * @param {string} currentUserId
   * @returns {Promise<User[]>}
   */
  async getSuggestions(currentUserId) {
    const currentUser = await User.findById(currentUserId).select('following');
    const excludeIds = [...(currentUser?.following || []), currentUserId];

    return User.find({ _id: { $nin: excludeIds } })
      .select('name institute profilePicture')
      .limit(10);
  }
}

export default new UserService();
