import { getSessionHistory, appendToHistory, updateLastResponse } from '../services/historyService.js';
import { processChatFlow } from '../agents/orchestrator.js';
import { logger } from '../utils/logger.js';

/**
 * Chat Controller (Production V3 - Redis Accelerated)
 * Handles standard chat flow with ultra-fast Redis memory.
 */
export const handleChat = async (req, res) => {
  const { question, workspaceId, chatId, stream = true, regenerate = false, mode = 'hybrid' } = req.body;
  const userId = req.user?.id;

  if (!question || !workspaceId) {
    return res.status(400).json({ error: 'Question and Workspace ID are required' });
  }

  try {
    const Document = (await import('../models/Document.js')).default;
    const docs = await Document.find({ workspaceId, userId, status: 'completed' }).select('_id');
    const targetDocumentIds = docs.map(d => d._id.toString());
    const history = await getSessionHistory(chatId, userId, workspaceId);

    if (stream) {
      // 1. Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullAnswer = '';

      // 2. Process with onStream callback
      const result = await processChatFlow(question, targetDocumentIds, userId, { 
        workspaceId,
        history,
        regenerate,
        mode,
        onStream: (chunk) => {
          fullAnswer += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      });

      if (!result.success) {
        res.write(`data: ${JSON.stringify({ error: result.error })}\n\n`);
        return res.end();
      }

      // 3. Final cleanup and persistence
      let chatSession;
      if (!fullAnswer && result.answer) fullAnswer = result.answer;
      // Fallback if everything is empty — prevent saving blank messages
      if (!fullAnswer || fullAnswer.trim().length === 0) {
        fullAnswer = "I could not generate a response. Please try asking again.";
      }
      
      if (regenerate && chatId) {
        chatSession = await updateLastResponse(chatId, userId, fullAnswer, workspaceId, result);
      } else {
        chatSession = await appendToHistory(chatId, userId, question, fullAnswer, workspaceId, result);
      }
      
      // Send final metadata
      res.write(`data: ${JSON.stringify({ 
        done: true, 
        chatId: chatSession._id, 
        title: chatSession.title,
        messages: chatSession.messages, // Include messages with IDs
        ...result,
        answer: fullAnswer // Final full answer
      })}\n\n`);
      
      return res.end();
    } else {
      // Standard non-streaming flow
      const result = await processChatFlow(question, targetDocumentIds, userId, { 
        workspaceId,
        history,
        mode
      });
      
      if (!result.success) return res.status(500).json(result);

      const chatSession = await appendToHistory(chatId, userId, question, result.answer, workspaceId);

      return res.json({
        ...result,
        chatId: chatSession._id,
        title: chatSession.title
      });
    }

  } catch (error) {
    logger.error('Chat Error (handleChat)', { error: error.message, userId });
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.end();
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
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    const Chat = (await import('../models/Chat.js')).default;
    const chatSession = await Chat.findOne({ _id: req.params.id, user: req.user?.id, workspaceId });
    if (!chatSession) return res.status(404).json({ error: 'Chat not found in this workspace' });
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
    const { title, workspaceId } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    const Chat = (await import('../models/Chat.js')).default;
    const chatSession = await Chat.findOneAndUpdate(
      { _id: req.params.id, user: req.user?.id, workspaceId },
      { title },
      { new: true }
    );
    
    if (!chatSession) return res.status(404).json({ error: 'Chat not found in this workspace' });
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
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    const Chat = (await import('../models/Chat.js')).default;
    const chatSession = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user?.id, workspaceId });
    if (!chatSession) return res.status(404).json({ error: 'Chat not found in this workspace' });
    return res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete chat session' });
  }
};

/**
 * Delete a specific message from a chat session
 */
export const deleteMessageFromSession = async (req, res) => {
  const { chatId, messageId } = req.params;
  const userId = req.user.id;

  try {
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace ID is required' });

    const { deleteMessage } = await import('../services/historyService.js');
    await deleteMessage(chatId, userId, messageId, workspaceId);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    logger.error('Failed to delete message', { err: err.message, chatId, messageId });
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
