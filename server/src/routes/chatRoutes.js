import express from 'express';
import { 
  handleChat, listSessions, getChatSession, 
  updateChatSession, deleteChatSession, deleteMessageFromSession 
} from '../controllers/chatController.js';
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
router.delete('/sessions/:chatId/messages/:messageId', procted, deleteMessageFromSession);

export default router;
