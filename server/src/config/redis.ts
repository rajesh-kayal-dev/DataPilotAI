import { Redis } from '@upstash/redis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Upstash Redis REST Client — TypeScript version
 * Replaces redis.js. Conditionally creates the client only when credentials
 * are present, so the server boots cleanly even without Redis configured.
 */

export type RedisClient = Redis | null;

/**
 * Upstash REST client, or null when UPSTASH_REDIS_REST_URL / TOKEN are absent.
 * Consumers must null-check before use — the absence of the client means
 * caching and rate limiting are disabled but the server stays healthy.
 */
let redisClient: RedisClient = null;

if (config.upstash.url && config.upstash.token) {
  redisClient = new Redis({
    url: config.upstash.url,
    token: config.upstash.token,
  });
} else {
  logger.warn('Upstash Redis not configured — caching and rate limiting disabled');
}

/**
 * Performs a lightweight write health-check against Upstash.
 * Returns early (no-op) when `redisClient` is null.
 */
const connectRedis = async (): Promise<void> => {
  if (!redisClient) return;

  try {
    await redisClient.set('health_check', 'ok', { ex: 60 });
    logger.info('Upstash Redis connected successfully');
  } catch (error) {
    const err = error as Error;
    logger.error('Upstash Redis REST connection check failed:', { error: err.message });
  }
};

export { redisClient, connectRedis };
