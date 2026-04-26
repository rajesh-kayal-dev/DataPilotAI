import { redisClient } from '../config/redis.js';

/**
 * Analytics Utility
 * Tracks usage metrics in Redis for observability.
 * Updated to use .multi() for node-redis v4 compatibility.
 */
export const trackMetrics = async (userId, data) => {
  if (!redisClient || !userId) return;

  const today = new Date().toISOString().split('T')[0];

  try {
    const multi = redisClient.multi();

    // 1. Increment total queries for user
    multi.incr(`metrics:user:${userId}:total`);
    
    // 2. Increment daily global queries
    multi.incr(`metrics:global:${today}:total`);

    // 3. Track model usage
    if (data.model) {
      multi.hIncrBy(`metrics:global:${today}:models`, data.model, 1);
    }

    // 4. Track failures
    if (data.success === false) {
      multi.incr(`metrics:global:${today}:failures`);
    }

    // 5. Estimated tokens (simplified)
    const tokens = data.tokens || 0;
    multi.incrBy(`metrics:user:${userId}:tokens`, tokens);

    await multi.exec();
  } catch (error) {
    // Analytics should never crash the main flow
    console.error('Analytics Tracking Error:', error.message);
  }
};
