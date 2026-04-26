import { redisClient } from '../config/redis.js';
import { logger } from './logger.js';
import { config } from '../config/env.js';

/**
 * Production Rate Limiter & Quota Management
 * Uses Redis Multi for atomic increment and expiry.
 */
export const checkRateLimit = async (userId) => {
  if (!userId || !redisClient) return { allowed: true };

  const today = new Date().toISOString().split('T')[0];
  const minuteKey = `ratelimit:min:${userId}`;
  const dailyKey = `quota:day:${userId}:${today}`;

  const { rateMax, rateWindow, dailyQuota } = config.limits;

  try {
    // node-redis v4+ uses .multi() for atomic operations
    const results = await redisClient.multi()
      .incr(minuteKey)
      .incr(dailyKey)
      .expire(minuteKey, rateWindow)
      .expire(dailyKey, 86400)
      .exec();

    // results is an array of responses: [minCount, dayCount, exp1, exp2]
    const minCount = results[0];
    const dayCount = results[1];

    // 1. Spike Protection (Per Minute)
    if (minCount > rateMax) {
      return { allowed: false, message: "Too many requests. Please wait a minute." };
    }

    // 2. Daily Quota (Cost Control)
    if (dayCount > dailyQuota) {
      logger.warn('User hit daily quota', { userId, quota: dailyQuota });
      return { allowed: false, message: "Daily limit reached. Come back tomorrow!" };
    }

    return { allowed: true, remaining: dailyQuota - dayCount };

  } catch (error) {
    logger.error('RateLimiter Error', { error: error.message });
    return { allowed: true }; // Fail-open for production stability
  }
};
