import { redisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import Chat from '../models/Chat.js';

/**
 * History Service (Production V1 - Redis Enhanced)
 * Provides ultra-fast chat history retrieval and persistence.
 */

const TTL = 3600; // 1 hour session cache

/**
 * Get chat history for a session
 * Tries Redis first, falls back to MongoDB
 */
export const getSessionHistory = async (chatId, userId) => {
  if (!chatId) return [];

  const cacheKey = `chat_history:${chatId}`;

  try {
    // 1. Try Redis
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return Array.isArray(cached) ? cached.slice(-10) : [];
    }

    // 2. Fallback to MongoDB
    const chatSession = await Chat.findOne({ _id: chatId, user: userId }).select('messages');
    if (chatSession) {
      const history = chatSession.messages.slice(-10);
      // Cache in Redis for next time
      await redisClient.set(cacheKey, history, { ex: TTL });
      return history;
    }
  } catch (err) {
    logger.error('History Service Error (Get)', { err: err.message, chatId });
  }

  return [];
};

/**
 * Append messages to history
 * Updates both Redis and MongoDB
 */
export const appendToHistory = async (chatId, userId, userMsg, assistantMsg, workspaceId, metadata = {}) => {
  try {
    const cacheKey = `chat_history:${chatId}`;
    let chatSession;

    const assistantPayload = { 
      role: 'assistant', 
      content: assistantMsg,
      source: metadata.source,
      modelName: metadata.model,
      confidence: metadata.confidence
    };

    if (chatId) {
      chatSession = await Chat.findOne({ _id: chatId, user: userId });
      if (chatSession) {
        chatSession.messages.push({ role: 'user', content: userMsg });
        chatSession.messages.push(assistantPayload);
        await chatSession.save();
        
        // Update Redis
        const updatedHistory = chatSession.messages.slice(-10);
        await redisClient.set(cacheKey, updatedHistory, { ex: TTL });
        return chatSession;
      }
    }

    // New Chat Creation
    const words = userMsg.split(' ').slice(0, 6).join(' ');
    const title = words.length > 30 ? words.slice(0, 30) + '...' : words;

    chatSession = new Chat({
      title,
      workspaceId,
      user: userId,
      messages: [
        { role: 'user', content: userMsg },
        assistantPayload
      ]
    });
    
    await chatSession.save();
    // Seed Redis
    await redisClient.set(`chat_history:${chatSession._id}`, chatSession.messages, { ex: TTL });
    
    return chatSession;
  } catch (err) {
    logger.error('History Service Error (Append)', { err: err.message, chatId });
    throw err;
  }
};

/**
 * Update only the last assistant response
 * Used for regeneration
 */
export const updateLastResponse = async (chatId, userId, newAssistantMsg, metadata = {}) => {
  try {
    const cacheKey = `chat_history:${chatId}`;
    const chatSession = await Chat.findOne({ _id: chatId, user: userId });
    
    if (chatSession && chatSession.messages.length > 0) {
      // Find the last assistant message and update it
      for (let i = chatSession.messages.length - 1; i >= 0; i--) {
        if (chatSession.messages[i].role === 'assistant') {
          chatSession.messages[i].content = newAssistantMsg;
          chatSession.messages[i].source = metadata.source;
          chatSession.messages[i].modelName = metadata.model;
          chatSession.messages[i].confidence = metadata.confidence;
          break;
        }
      }
      
      await chatSession.save();
      
      // Sync Redis
      const updatedHistory = chatSession.messages.slice(-10);
      await redisClient.set(cacheKey, updatedHistory, { ex: TTL });
      return chatSession;
    }
  } catch (err) {
    logger.error('History Service Error (Update)', { err: err.message, chatId });
    throw err;
  }
};

/**
 * Delete a specific message from history
 */
export const deleteMessage = async (chatId, userId, messageId) => {
  try {
    const cacheKey = `chat_history:${chatId}`;
    const chatSession = await Chat.findOne({ _id: chatId, user: userId });
    
    if (chatSession) {
      chatSession.messages = chatSession.messages.filter(m => m._id.toString() !== messageId);
      await chatSession.save();
      
      // Sync Redis
      const updatedHistory = chatSession.messages.slice(-10);
      await redisClient.set(cacheKey, updatedHistory, { ex: TTL });
      return chatSession;
    }
  } catch (err) {
    logger.error('History Service Error (Delete Message)', { err: err.message, chatId, messageId });
    throw err;
  }
};
