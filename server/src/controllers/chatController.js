import { processChatFlow } from '../agents/orchestrator.js';
import { getSessionHistory, appendToHistory } from '../services/historyService.js';
import { logger } from '../utils/logger.js';

/**
 * Chat Controller (Production V3 - Redis Accelerated)
 * Handles standard chat flow with ultra-fast Redis memory.
 */
export const handleChat = async (req, res) => {
  const { question, workspaceId, chatId } = req.body;
  const userId = req.user?.id;

  if (!question || !workspaceId) {
    return res.status(400).json({ error: 'Question and Workspace ID are required' });
  }

  try {
    const Document = (await import('../models/Document.js')).default;
    
    // 1. Fetch relevant documents in workspace
    const docs = await Document.find({ workspaceId, userId, status: 'completed' }).select('_id');
    const targetDocumentIds = docs.map(d => d._id.toString());

    // 2. Fetch History from Redis (Sub-ms performance)
    const history = await getSessionHistory(chatId, userId);

    // 3. Process the chat with memory
    const result = await processChatFlow(question, targetDocumentIds, userId, { 
      workspaceId,
      history 
    });
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    // 4. Update Persistence (Redis + MongoDB)
    const chatSession = await appendToHistory(chatId, userId, question, result.answer, workspaceId);

    return res.json({
      ...result,
      chatId: chatSession._id,
      title: chatSession.title
    });

  } catch (error) {
    logger.error('Chat Error (handleChat)', { error: error.message, userId });
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
};

/**
 * List Chat Sessions
 */
export const listSessions = async (req, res) => {
  const { workspaceId } = req.query;
  const userId = req.user?.id;
  const Chat = (await import('../models/Chat.js')).default;

  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID is required' });
  }

  try {
    const sessions = await Chat.find({ workspaceId, user: userId })
      .select('title createdAt')
      .sort({ createdAt: -1 });
    
    return res.json(sessions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get Specific Chat Session
 */
export const getChatSession = async (req, res) => {
  try {
    const Chat = (await import('../models/Chat.js')).default;
    const chatSession = await Chat.findOne({ _id: req.params.id, user: req.user?.id });
    if (!chatSession) return res.status(404).json({ error: 'Chat not found' });
    return res.json(chatSession);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch chat session' });
  }
};

/**
 * Update Chat Session (Rename)
 */
export const updateChatSession = async (req, res) => {
  try {
    const Chat = (await import('../models/Chat.js')).default;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const chatSession = await Chat.findOneAndUpdate(
      { _id: req.params.id, user: req.user?.id },
      { title },
      { new: true }
    );
    
    if (!chatSession) return res.status(404).json({ error: 'Chat not found' });
    return res.json(chatSession);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update chat session' });
  }
};

/**
 * Delete Chat Session
 */
export const deleteChatSession = async (req, res) => {
  try {
    const Chat = (await import('../models/Chat.js')).default;
    const chatSession = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user?.id });
    if (!chatSession) return res.status(404).json({ error: 'Chat not found' });
    return res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete chat session' });
  }
};
