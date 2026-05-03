import { getGroupedModels, resolveModel, MODEL_REGISTRY, DEFAULT_MODEL_ID } from '../config/modelRegistry.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

// Helper: safe Redis get — returns null on any failure
const safeRedisGet = async (redisClient, key) => {
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
};

// Helper: safe Redis set — silently ignores failures
const safeRedisSet = async (redisClient, key, value, opts) => {
  try {
    await redisClient.set(key, value, opts);
  } catch {
    // Redis unavailable — no-op, MongoDB is the source of truth
  }
};

// Helper: safe Redis del — silently ignores failures
const safeRedisDel = async (redisClient, key) => {
  try {
    await redisClient.del(key);
  } catch {
    // no-op
  }
};

// GET /api/models — returns grouped model list for the dropdown
export const getModels = (_req, res) => {
  res.json(getGroupedModels());
};

// PATCH /api/user/model — save user's selected model
export const setUserModel = async (req, res) => {
  try {
    const { modelId } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const entry = MODEL_REGISTRY.find(m => m.id === modelId);
    if (!entry) return res.status(400).json({ error: 'Invalid model ID' });

    const user = await User.findById(userId);
    if (entry.type === 'paid' && user.plan === 'free') {
      return res.status(403).json({ error: 'Upgrade to Pro to use this model', upgrade: true });
    }

    user.selectedModel = modelId;
    await user.save();

    // Invalidate Redis cache (best-effort)
    const { redisClient } = await import('../config/redis.js');
    await safeRedisDel(redisClient, `user_model_info:${userId}`);

    res.json({ success: true, selectedModel: modelId, model: entry.model });
  } catch (err) {
    logger.error('setUserModel error', { error: err.message });
    res.status(500).json({ error: 'Failed to update model' });
  }
};

// GET /api/user/model — get user's currently selected model
export const getUserModel = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Try Redis first (best-effort)
    const { redisClient } = await import('../config/redis.js');
    const cached = await safeRedisGet(redisClient, `user_model_info:${userId}`);
    if (cached) {
      try {
        return res.json(typeof cached === 'object' ? cached : JSON.parse(cached));
      } catch {
        await safeRedisDel(redisClient, `user_model_info:${userId}`);
      }
    }

    // 2. Fallback to Mongo
    const user = await User.findById(userId).select('selectedModel plan');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const modelId = user.selectedModel || DEFAULT_MODEL_ID;
    const response = {
      modelId,
      model: resolveModel(modelId),
      plan: user.plan || 'free',
    };

    // 3. Cache for 1 hour (best-effort)
    await safeRedisSet(redisClient, `user_model_info:${userId}`, JSON.stringify(response), { ex: 3600 });

    res.json(response);
  } catch (err) {
    logger.error('getUserModel error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch model' });
  }
};

// PATCH /api/user/rag-mode — set user's RAG mode (hybrid/strict)
export const setRagMode = async (req, res) => {
  try {
    const { mode } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!['hybrid', 'strict'].includes(mode)) return res.status(400).json({ error: 'Invalid RAG mode' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.ragMode = mode;
    await user.save();

    // Cache in Redis (best-effort)
    const { redisClient } = await import('../config/redis.js');
    await safeRedisSet(redisClient, `user_rag_mode:${userId}`, mode, { ex: 86400 });

    res.json({ success: true, mode });
  } catch (err) {
    logger.error('setRagMode error', { error: err.message });
    res.status(500).json({ error: 'Failed to update RAG mode' });
  }
};

// GET /api/user/rag-mode — get user's persistent RAG mode
export const getRagMode = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Try Redis first (best-effort)
    const { redisClient } = await import('../config/redis.js');
    const cached = await safeRedisGet(redisClient, `user_rag_mode:${userId}`);
    if (cached) return res.json({ mode: cached });

    // 2. Fallback to Mongo
    const user = await User.findById(userId).select('ragMode');
    const mode = user?.ragMode || 'hybrid';

    // Seed Redis (best-effort)
    await safeRedisSet(redisClient, `user_rag_mode:${userId}`, mode, { ex: 86400 });

    res.json({ mode });
  } catch (err) {
    logger.error('getRagMode error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch RAG mode' });
  }
};
