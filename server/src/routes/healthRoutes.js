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
  const isRedisConnected = redisClient && (redisClient.isOpen || redisClient.isReady);

  const health = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: {
      mongodb: isMongoConnected ? 'up' : 'down',
      redis: isRedisConnected ? 'up' : 'down',
    }
  };

  // In production, we might want 503 for Load Balancers
  // But for our UI health check, we'll return 200 with degraded status if any service is down
  if (!isMongoConnected || !isRedisConnected) {
    health.status = 'degraded';
    // If Mongo is down, it's critical, maybe still 503
    if (!isMongoConnected) return res.status(503).json(health);
    // If only Redis is down, we can still serve some requests (cache will be missed)
    return res.status(200).json(health);
  }

  res.json(health);
});

export default router;
