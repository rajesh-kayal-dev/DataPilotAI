import { redisClient } from '../config/redis.js';
import crypto from 'crypto';

/**
 * Response Cache Utility
 * key = hash(question + documentId)
 * TTL = 1 hour
 */
export const getCacheKey = (question, documentId) => {
  const hash = crypto.createHash('sha256')
    .update(`${question}:${documentId}`)
    .digest('hex');
  return `cache:chat:${hash}`;
};

export const getCachedResponse = async (key) => {
  try {
    if (!redisClient) return null;
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null; // Cache fail-open
  }
};

export const setCachedResponse = async (key, data, ttl = 3600) => {
  try {
    if (!redisClient) return;
    // Updated for node-redis v4+ options object
    await redisClient.set(key, JSON.stringify(data), {
      ex: ttl
    });
  } catch {
    // Best-effort cache — silently ignore Redis failures
  }
};
