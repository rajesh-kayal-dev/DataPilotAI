import { getSessionHistory, appendToHistory, updateLastResponse } from '../services/historyService.js';
import { processChatFlow } from '../agents/orchestrator.js';
import { logger } from '../utils/logger.js';

/**
 * Chat Controller (Production V3 - Redis Accelerated)
 * Handles standard chat flow with ultra-fast Redis memory.
 */
export const handleChat = async (req, res) => {
  const { question, workspaceId, chatId, stream = true, regenerate = false, mode = 'hybrid', selectedAgent = 'chat', webSearch = false } = req.body;
  const userId = req.user?.id;

  if (!question || !workspaceId) {
    return res.status(400).json({ error: 'Question and Workspace ID are required' });
  }

  try {
    const Document = (await import('../models/Document.js')).default;
    const Chat = (await import('../models/Chat.js')).default;
    
    let chatSession;
    if (chatId) {
      chatSession = await Chat.findOne({ _id: chatId, user: userId, workspaceId });
    }

    const docs = await Document.find({ workspaceId, userId }).select('_id name status');
    let targetDocumentIds = [];
    let activeDocumentIdToSave = null;
    let needsSelection = false;
    let selectionMessage = '';

    const queryLower = question.toLowerCase();

    // 1. Check if user explicitly mentioned a document name to switch
    const matchedDoc = docs.find(d => {
       const nameLower = d.name.toLowerCase();
       return queryLower.includes(nameLower) || queryLower.includes(nameLower.split('.')[0]);
    });

    if (matchedDoc) {
       targetDocumentIds = [matchedDoc._id.toString()];
       activeDocumentIdToSave = matchedDoc._id;
       // If it is a different document than current, confirm switch
       if (chatSession && chatSession.activeDocumentId && chatSession.activeDocumentId.toString() !== matchedDoc._id.toString()) {
         req.documentSelected = matchedDoc.name;
       }
    } 
    // 2. Check if user explicitly asks to clear selection or search all documents
    else if (queryLower.includes('all documents') || queryLower.includes('search all') || queryLower.includes('clear selection') || queryLower.includes('reset document')) {
       targetDocumentIds = docs.map(d => d._id.toString());
       activeDocumentIdToSave = null;
       req.documentSelected = 'all documents in the workspace';
    }
    // 3. Fallback to session active document
    else if (chatSession && chatSession.activeDocumentId) {
      targetDocumentIds = [chatSession.activeDocumentId.toString()];
      activeDocumentIdToSave = chatSession.activeDocumentId;
    } 
    // 4. Default: automatic selection logic
    else {
      if (docs.length === 0) {
        targetDocumentIds = [];
      } else if (docs.length === 1) {
        targetDocumentIds = [docs[0]._id.toString()];
        activeDocumentIdToSave = docs[0]._id;
      } else {
        const explicitRef = ['this document', 'my resume', 'that pdf'].some(ref => queryLower.includes(ref));

        const isNumber = /^\s*\d+\s*$/.test(question);
        if (isNumber) {
           const index = parseInt(question.trim(), 10) - 1;
           if (index >= 0 && index < docs.length) {
              targetDocumentIds = [docs[index]._id.toString()];
              activeDocumentIdToSave = docs[index]._id;
              needsSelection = false;
              req.documentSelected = docs[index].name;
           } else {
              needsSelection = true;
           }
        } else if (!explicitRef) {
           needsSelection = true;
        } else {
           needsSelection = true;
        }
      }
    }

    if (needsSelection) {
      selectionMessage = "Please select a document to chat with:\n\n" + docs.map((d, i) => `${i + 1}. ${d.name}`).join('\n');
    }

    // Check if the selected document(s) are still processing or failed
    if (!needsSelection && targetDocumentIds.length > 0 && !req.documentSelected) {
      const targetDocs = await Document.find({ _id: { $in: targetDocumentIds } });
      const processingDoc = targetDocs.find(d => d.status === 'processing');
      const failedDoc = targetDocs.find(d => d.status === 'failed');

      if (processingDoc || failedDoc) {
        const statusMsg = processingDoc 
          ? `The document **${processingDoc.name}** is still processing. Please wait a few seconds and try again.` 
          : `The document **${failedDoc.name}** failed to index. Please delete it and re-upload.`;
        
        if (stream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.write(`data: ${JSON.stringify({ chunk: statusMsg })}\n\n`);
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          return res.end();
        } else {
          return res.json({ success: true, answer: statusMsg, model: 'system', source: 'System' });
        }
      }
    }

    const history = await getSessionHistory(chatId, userId, workspaceId);

    if (stream) {
      // 1. Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullAnswer = '';

      // 2. Process with onStream callback or Bypass
      let result;
      if (needsSelection) {
        res.write(`data: ${JSON.stringify({ chunk: selectionMessage })}\n\n`);
        result = { success: true, answer: selectionMessage, model: 'system', confidence: 1, source: 'System' };
      } else if (req.documentSelected) {
        const confirmMsg = `I have selected **${req.documentSelected}**. What would you like to know about it?`;
        res.write(`data: ${JSON.stringify({ chunk: confirmMsg })}\n\n`);
        result = { success: true, answer: confirmMsg, model: 'system', confidence: 1, source: 'System' };
      } else {
        result = await processChatFlow(question, targetDocumentIds, userId, { 
          workspaceId,
          history,
          regenerate,
          mode,
          selectedAgent,
          webSearch,
          onStream: (chunk) => {
            fullAnswer += chunk;
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          },
          onStatus: (msg) => {
            res.write(`data: ${JSON.stringify({ status: msg })}\n\n`);
          }
        });
      }

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

      if (activeDocumentIdToSave && (!chatSession.activeDocumentId || chatSession.activeDocumentId.toString() !== activeDocumentIdToSave.toString())) {
         chatSession.activeDocumentId = activeDocumentIdToSave;
         await chatSession.save();
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
      let result;
      if (needsSelection) {
        result = { success: true, answer: selectionMessage, model: 'system', confidence: 1, source: 'System' };
      } else if (req.documentSelected) {
        result = { success: true, answer: `I have selected **${req.documentSelected}**. What would you like to know about it?`, model: 'system', confidence: 1, source: 'System' };
      } else {
        result = await processChatFlow(question, targetDocumentIds, userId, { 
          workspaceId,
          history,
          mode,
          selectedAgent,
          webSearch,
        });
      }
      
      if (!result.success) return res.status(500).json(result);

      const savedChatSession = await appendToHistory(chatId, userId, question, result.answer, workspaceId);
      
      if (activeDocumentIdToSave && (!savedChatSession.activeDocumentId || savedChatSession.activeDocumentId.toString() !== activeDocumentIdToSave.toString())) {
         savedChatSession.activeDocumentId = activeDocumentIdToSave;
         await savedChatSession.save();
      }

      return res.json({
        ...result,
        chatId: savedChatSession._id,
        title: savedChatSession.title
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
