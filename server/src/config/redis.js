import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

/**
 * Redis Client with Auto-Retry and Monitoring
 */
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error('Max retries reached');
      return Math.min(retries * 100, 3000); // Exponential backoff
    }
  }
});

redisClient.on('error', (error) => {
  logger.error('Redis error occurred:', { error: error.message });
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis attempting to reconnect...');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Initial Redis connection failed:', { error: error.message });
    // Don't exit, let the reconnect strategy handle it
  }
};

export { redisClient, connectRedis };