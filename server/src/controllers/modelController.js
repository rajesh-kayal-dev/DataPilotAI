import { getGroupedModels, resolveModel, MODEL_REGISTRY, DEFAULT_MODEL_ID } from '../config/modelRegistry.js';
import User from '../models/User.js';

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

    // Validate model exists in registry
    const entry = MODEL_REGISTRY.find(m => m.id === modelId);
    if (!entry) return res.status(400).json({ error: 'Invalid model ID' });

    // Paid model guard — only pro users can select paid models
    const user = await User.findById(userId);
    if (entry.type === 'paid' && user.plan === 'free') {
      return res.status(403).json({ error: 'Upgrade to Pro to use this model', upgrade: true });
    }

    user.selectedModel = modelId;
    await user.save();

    res.json({ success: true, selectedModel: modelId, model: entry.model });
  } catch (err) {
    console.error('setUserModel error:', err.message);
    res.status(500).json({ error: 'Failed to update model' });
  }
};

// GET /api/user/model — get user's currently selected model
export const getUserModel = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(userId).select('selectedModel plan');
    const modelId = user?.selectedModel || DEFAULT_MODEL_ID;

    res.json({
      modelId,
      model: resolveModel(modelId),
      plan: user?.plan || 'free',
    });
  } catch (err) {
    console.error('getUserModel error:', err.message);
    res.status(500).json({ error: 'Failed to fetch model' });
  }
};

// PATCH /api/user/rag-mode — set user's RAG mode (hybrid/strict)
export const setRagMode = async (req, res) => {
  try {
    const { mode } = req.body;
    const userId = req.user?.id;
    const { redisClient } = await import('../config/redis.js');

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!['hybrid', 'strict'].includes(mode)) return res.status(400).json({ error: 'Invalid RAG mode' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.ragMode = mode;
    await user.save();

    // Cache in Redis for 24h
    await redisClient.set(`user_rag_mode:${userId}`, mode, { ex: 86400 });

    res.json({ success: true, mode });
  } catch (err) {
    console.error('setRagMode error:', err.message);
    res.status(500).json({ error: 'Failed to update RAG mode' });
  }
};

// GET /api/user/rag-mode — get user's persistent RAG mode
export const getRagMode = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { redisClient } = await import('../config/redis.js');

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Try Redis first
    const cached = await redisClient.get(`user_rag_mode:${userId}`);
    if (cached) return res.json({ mode: cached });

    // 2. Fallback to Mongo
    const user = await User.findById(userId).select('ragMode');
    const mode = user?.ragMode || 'hybrid';

    // Seed Redis
    await redisClient.set(`user_rag_mode:${userId}`, mode, { ex: 86400 });

    res.json({ mode });
  } catch (err) {
    console.error('getRagMode error:', err.message);
    res.status(500).json({ error: 'Failed to fetch RAG mode' });
  }
};
