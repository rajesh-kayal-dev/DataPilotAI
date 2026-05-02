// Central registry for all models (clean + production-ready)

export const MODEL_REGISTRY = [

  // =========================
  // FREE MODELS (DEFAULT)
  // =========================

  {
    id: 'gpt-oss-120b',
    label: 'GPT OSS 120B',
    provider: 'OpenAI (OSS)',
    model: 'openai/gpt-oss-120b:free',
    type: 'free',
    tier: 'top',
    badge: 'Recommended',
  },
  {
    id: 'mimo-flash',
    label: 'MiMo V2 Flash',
    provider: 'Xiaomi',
    model: 'xiaomi/mimo-v2-flash',
    type: 'free',
    tier: 'top',
    badge: 'Popular',
  },
  {
    id: 'gemma-4b',
    label: 'Gemma 3 4B',
    provider: 'Google',
    model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
    type: 'free',
    tier: 'top',
    badge: 'Free',
  },
  {
    id: 'deepseek-r1-free',
    label: 'DeepSeek R1',
    provider: 'DeepSeek',
    model: 'deepseek/deepseek-r1:free',
    type: 'free',
    tier: 'top',
    badge: 'Reasoning',
  },
  {
    id: 'llama-3-8b',
    label: 'Llama 3 8B',
    provider: 'Meta',
    model: 'meta-llama/llama-3-8b-instruct:free',
    type: 'free',
    tier: 'fast',
    badge: 'Fast',
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
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'OpenAI',
    model: 'openai/gpt-4o',
    type: 'paid',
    tier: 'premium',
    badge: 'Flagship',
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    provider: 'OpenAI',
    model: 'openai/gpt-4o-mini',
    type: 'paid',
    tier: 'budget',
    badge: 'Fast',
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
    id: 'claude-sonnet',
    label: 'Claude Sonnet',
    provider: 'Anthropic',
    model: 'anthropic/claude-sonnet-4-6',
    type: 'paid',
    tier: 'balanced',
    badge: 'Best',
  },
  {
    id: 'deepseek-chat',
    label: 'DeepSeek V3',
    provider: 'DeepSeek',
    model: 'deepseek/deepseek-chat',
    type: 'paid',
    tier: 'balanced',
    badge: 'Best',
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

export const DEFAULT_MODEL_ID = 'gpt-oss-120b';

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