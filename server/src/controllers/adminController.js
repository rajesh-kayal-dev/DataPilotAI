import { redisClient } from '../config/redis.js';
import Feedback from '../models/Feedback.js';

/**
 * Admin Controller
 * High-level system observability for post-launch monitoring.
 */
export const getSystemMetrics = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Fetch real-time metrics from Redis
    const totalToday = await redisClient.get(`metrics:global:${today}:total`) || 0;
    const failuresToday = await redisClient.get(`metrics:global:${today}:failures`) || 0;
    const modelUsage = await redisClient.hGetAll(`metrics:global:${today}:models`) || {};

    // 2. Fetch feedback count from DB
    const feedbackCount = await Feedback.countDocuments({
      createdAt: { $gte: new Date(today) }
    });

    res.json({
      success: true,
      today: {
        totalRequests: parseInt(totalToday),
        failures: parseInt(failuresToday),
        failureRate: totalToday > 0 ? ((failuresToday / totalToday) * 100).toFixed(2) + '%' : '0%',
        modelUsage,
        feedbackCollected: feedbackCount
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
