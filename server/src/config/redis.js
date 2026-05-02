import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger.js';

/**
 * Upstash Redis REST Client
 * Ideal for serverless and cloud environments.
 */
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const connectRedis = async () => {
  try {
    // Simple ping-like test
    await redisClient.set('health_check', 'ok', { ex: 60 });
    logger.info('Upstate redis connected successfully');
  } catch (error) {
    logger.error('Upstash Redis REST connection check failed:', { error: error.message });
  }
};

export { redisClient, connectRedis };