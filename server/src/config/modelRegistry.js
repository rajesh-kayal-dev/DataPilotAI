// Central registry for all models (clean + production-ready)

export const MODEL_REGISTRY = [

  // =========================
  // FREE MODELS (DEFAULT)
  // =========================

  {
    id: 'mimo-flash',
    label: 'MiMo V2 Flash',
    provider: 'Xiaomi',
    model: 'xiaomi/mimo-v2-flash',
    type: 'free',
    tier: 'top',
    badge: 'Recommended',
  },
  {
    id: 'gemma-4b',
    label: 'Gemma 3 4B',
    provider: 'Google',
    model: 'google/gemma-3-4b-it:free',
    type: 'free',
    tier: 'top',
    badge: 'Free',
  },
  {
    id: 'devstral',
    label: 'Devstral 2512',
    provider: 'Mistral',
    model: 'mistralai/devstral-2512:free',
    type: 'free',
    tier: 'top',
    badge: 'Free',
  },
  {
    id: 'qwen3',
    label: 'Qwen 3',
    provider: 'Qwen',
    model: 'qwen/qwen3-coder:free',
    type: 'free',
    tier: 'specialized',
    badge: 'Coding',
  },

  // =========================
  // PAID MODELS (PRO USERS)
  // =========================

  {
    id: 'claude-haiku',
    label: 'Claude Haiku',
    provider: 'Anthropic',
    model: 'anthropic/claude-haiku-4-5',
    type: 'paid',
    tier: 'fast',
    badge: 'Fast',
  },
  {
    id: 'claude-sonnet',
    label: 'Claude Sonnet',
    provider: 'Anthropic',
    model: 'anthropic/claude-sonnet-4-6',
    type: 'paid',
    tier: 'balanced',
    badge: 'Best',
  },
  {
    id: 'claude-opus',
    label: 'Claude Opus',
    provider: 'Anthropic',
    model: 'anthropic/claude-opus-4-6',
    type: 'paid',
    tier: 'premium',
    badge: 'Powerful',
  },
  {
    id: 'gemini-flash',
    label: 'Gemini Flash',
    provider: 'Google',
    model: 'google/gemini-flash-1.5',
    type: 'paid',
    tier: 'fast',
    badge: 'Fast',
  }

];

// =========================
// DEFAULT MODEL
// =========================

export const DEFAULT_MODEL_ID = 'mimo-flash';

// =========================
// RESOLVE MODEL (SAFE)
// =========================

export const resolveModel = (modelId) => {
  const entry = MODEL_REGISTRY.find(m => m.id === modelId);

  if (!entry) {
    const fallback = MODEL_REGISTRY.find(m => m.id === DEFAULT_MODEL_ID);
    return fallback?.model;
  }

  return entry.model;
};

// =========================
// VALIDATE MODEL
// =========================

export const isValidModel = (modelId) => {
  return MODEL_REGISTRY.some(m => m.id === modelId);
};

// =========================
// GET MODEL INFO
// =========================

export const getModelInfo = (modelId) => {
  return MODEL_REGISTRY.find(m => m.id === modelId);
};

// =========================
// GROUP FOR DROPDOWN
// =========================

export const getGroupedModels = () => ({
  free: MODEL_REGISTRY.filter(m => m.type === 'free'),
  paid: MODEL_REGISTRY.filter(m => m.type === 'paid'),
});