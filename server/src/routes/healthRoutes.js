import express from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';

const router = express.Router();

/**
 * Health Check API
 * Monitor system status in production.
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'up' : 'down',
      redis: redisClient && redisClient.status === 'ready' ? 'up' : 'down',
    }
  };

  if (health.services.mongodb === 'down' || health.services.redis === 'down') {
    health.status = 'degraded';
    return res.status(503).json(health);
  }

  res.json(health);
});

export default router;
