import express from 'express';
import { createChat, getChats, getChatById, updateChat, deleteChat } from '../controllers/chatController.js';

const router = express.Router();

router.post('/', createChat);
router.get('/', getChats);
router.get('/:id', getChatById);
router.patch('/:id', updateChat);
router.delete('/:id', deleteChat);

export default router;
