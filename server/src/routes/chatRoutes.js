import express from 'express';
import { handleChat, listSessions, getChatSession, updateChatSession, deleteChatSession } from '../controllers/chatController.js';
import { procted } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Chat Routes
 */
router.post('/', procted, handleChat);
router.get('/sessions', procted, listSessions);
router.get('/sessions/:id', procted, getChatSession);
router.patch('/sessions/:id', procted, updateChatSession);
router.delete('/sessions/:id', procted, deleteChatSession);

export default router;
