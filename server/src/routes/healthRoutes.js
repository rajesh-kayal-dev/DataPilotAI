import express from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';

const router = express.Router();

/**
 * Health Check API
 * Monitor system status in production.
 */
router.get('/health', async (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  let isRedisConnected = false;
  try {
    await redisClient.set('health_check', 'ok', { ex: 60 });
    isRedisConnected = true;
  } catch {}

  const health = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: {
      mongodb: isMongoConnected ? 'up' : 'down',
      redis: isRedisConnected ? 'up' : 'down',
    }
  };

  if (!isMongoConnected || !isRedisConnected) {
    health.status = 'degraded';
    if (!isMongoConnected) return res.status(503).json(health);
    return res.status(200).json(health);
  }

  res.json(health);
});

export default router;
