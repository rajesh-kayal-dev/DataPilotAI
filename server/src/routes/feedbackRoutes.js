import express from 'express';
import Feedback from '../models/Feedback.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Feedback Collection API
 */
router.post('/', async (req, res) => {
  const { question, answer, rating, model, documentId } = req.body;
  const userId = req.user?.id;

  if (!rating || !question || !answer) {
    return res.status(400).json({ error: 'Missing feedback data' });
  }

  try {
    const feedback = new Feedback({
      userId,
      question,
      answer,
      rating,
      model,
      documentId
    });

    await feedback.save();
    logger.info('User feedback received', { userId, rating });
    
    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    logger.error('Feedback Error', { error: error.message });
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

export default router;
