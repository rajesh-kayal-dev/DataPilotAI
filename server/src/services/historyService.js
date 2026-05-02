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
export const appendToHistory = async (chatId, userId, userMsg, assistantMsg, workspaceId) => {
  try {
    const cacheKey = `chat_history:${chatId}`;
    let chatSession;

    if (chatId) {
      chatSession = await Chat.findOne({ _id: chatId, user: userId });
      if (chatSession) {
        chatSession.messages.push({ role: 'user', content: userMsg });
        chatSession.messages.push({ role: 'assistant', content: assistantMsg });
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
        { role: 'assistant', content: assistantMsg }
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
