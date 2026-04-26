import express from 'express';
import { handleChat } from '../controllers/chatController.js';
import { procted } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Chat Route
 * POST /api/chat
 * Body: { question, documentId }
 */
router.post('/', procted, handleChat);

export default router;
