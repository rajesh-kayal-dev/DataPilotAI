import { redisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import Chat from '../models/Chat.js';

/**
 * History Service (Production V2 - Redis Resilient)
 * MongoDB is the source of truth. Redis is a best-effort cache.
 */

const TTL = 3600; // 1 hour session cache

// Best-effort Redis set — never throws
const tryRedisSet = async (key, value, opts) => {
  try { await redisClient.set(key, value, opts); } catch { /* no-op */ }
};

// Best-effort Redis get — returns null on failure
const tryRedisGet = async (key) => {
  try { return await redisClient.get(key); } catch { return null; }
};

/**
 * Get chat history for a session
 * Tries Redis first, falls back to MongoDB
 */
export const getSessionHistory = async (chatId, userId, workspaceId) => {
  if (!chatId) return [];

  const cacheKey = `chat_history:${chatId}`;

  try {
    // 1. Try Redis (best-effort)
    const cached = await tryRedisGet(cacheKey);
    if (cached) {
      return Array.isArray(cached) ? cached.slice(-10) : [];
    }

    // 2. Fallback to MongoDB
    const chatSession = await Chat.findOne({ _id: chatId, user: userId, workspaceId }).select('messages');
    if (chatSession) {
      const history = chatSession.messages.slice(-10);
      await tryRedisSet(cacheKey, history, { ex: TTL });
      return history;
    }
  } catch (err) {
    logger.error('History Service Error (Get)', { error: err.message });
  }

  return [];
};

/**
 * Append messages to history
 * Updates MongoDB (guaranteed) then syncs Redis (best-effort)
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

        const updatedHistory = chatSession.messages.slice(-10);
        await tryRedisSet(cacheKey, updatedHistory, { ex: TTL });
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
    await tryRedisSet(`chat_history:${chatSession._id}`, chatSession.messages, { ex: TTL });

    return chatSession;
  } catch (err) {
    logger.error('History Service Error (Append)', { error: err.message });
    throw err;
  }
};

/**
 * Update only the last assistant response (used for regeneration)
 */
export const updateLastResponse = async (chatId, userId, newAssistantMsg, workspaceId, metadata = {}) => {
  try {
    const cacheKey = `chat_history:${chatId}`;
    const chatSession = await Chat.findOne({ _id: chatId, user: userId, workspaceId });

    if (chatSession && chatSession.messages.length > 0) {
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
      const updatedHistory = chatSession.messages.slice(-10);
      await tryRedisSet(cacheKey, updatedHistory, { ex: TTL });
      return chatSession;
    }
  } catch (err) {
    logger.error('History Service Error (Update)', { error: err.message });
    throw err;
  }
};

/**
 * Delete a specific message from history
 */
export const deleteMessage = async (chatId, userId, messageId, workspaceId) => {
  try {
    const cacheKey = `chat_history:${chatId}`;
    const chatSession = await Chat.findOne({ _id: chatId, user: userId, workspaceId });

    if (chatSession) {
      chatSession.messages = chatSession.messages.filter(m => m._id.toString() !== messageId);
      await chatSession.save();

      const updatedHistory = chatSession.messages.slice(-10);
      await tryRedisSet(cacheKey, updatedHistory, { ex: TTL });
      return chatSession;
    }
  } catch (err) {
    logger.error('History Service Error (Delete Message)', { error: err.message });
    throw err;
  }
};
