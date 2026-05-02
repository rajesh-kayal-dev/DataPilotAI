import { processChatFlow } from '../agents/orchestrator.js';
import Chat from '../models/Chat.js';

/**
 * Chat Controller (Production V2)
 * Handles standard JSON and real-time SSE streaming.
 */
export const handleChat = async (req, res) => {
  const { question, workspaceId, chatId } = req.body;
  const userId = req.user?.id;

  if (!question || !workspaceId) {
    return res.status(400).json({ error: 'Question and Workspace ID are required' });
  }

  try {
    const Document = (await import('../models/Document.js')).default;
    
    // Find all documents in workspace
    const docs = await Document.find({ workspaceId, userId, status: 'completed' }).select('_id');
    const targetDocumentIds = docs.map(d => d._id.toString());

    // Proceed even with 0 documents for general conversation

    // Process the chat
    const result = await processChatFlow(question, targetDocumentIds, userId, { workspaceId });
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    let chatSession;
    if (chatId) {
      chatSession = await Chat.findOne({ _id: chatId, user: userId });
      if (!chatSession) return res.status(404).json({ error: 'Chat session not found' });
      
      chatSession.messages.push({ role: 'user', content: question });
      chatSession.messages.push({ role: 'assistant', content: result.answer });
      await chatSession.save();
    } else {
      const words = question.split(' ').slice(0, 6).join(' ');
      const title = words.length > 30 ? words.slice(0, 30) + '...' : words;
      
      chatSession = new Chat({
        title,
        workspaceId,
        user: userId,
        messages: [
          { role: 'user', content: question },
          { role: 'assistant', content: result.answer }
        ]
      });
      await chatSession.save();
    }

    return res.json({
      ...result,
      chatId: chatSession._id,
      title: chatSession.title
    });

  } catch (error) {
    console.error('Chat Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
};

/**
 * List Chat Sessions
 * GET /api/chat/sessions?workspaceId=...
 */
export const listSessions = async (req, res) => {
  const { workspaceId } = req.query;
  const userId = req.user?.id;

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
 * GET /api/chat/sessions/:id
 */
export const getChatSession = async (req, res) => {
  try {
    const chatSession = await Chat.findOne({ _id: req.params.id, user: req.user?.id });
    if (!chatSession) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    return res.json(chatSession);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch chat session' });
  }
};

/**
 * Update Chat Session (Rename)
 * PATCH /api/chat/sessions/:id
 */
export const updateChatSession = async (req, res) => {
  try {
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
 * DELETE /api/chat/sessions/:id
 */
export const deleteChatSession = async (req, res) => {
  try {
    const chatSession = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user?.id });
    if (!chatSession) return res.status(404).json({ error: 'Chat not found' });
    return res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete chat session' });
  }
};
