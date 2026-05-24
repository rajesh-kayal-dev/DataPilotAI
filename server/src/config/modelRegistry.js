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
    apiProvider: 'openrouter',
    configured: true,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'mimo-flash',
    label: 'MiMo V2 Flash',
    provider: 'Xiaomi',
    model: 'xiaomi/mimo-v2-flash',
    type: 'free',
    tier: 'top',
    badge: 'Popular',
    apiProvider: 'openrouter',
    configured: true,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'gemma-4b',
    label: 'Gemma 3 4B',
    provider: 'Google',
    model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
    type: 'free',
    tier: 'top',
    badge: 'Free',
    apiProvider: 'openrouter',
    configured: true,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'deepseek-r1-free',
    label: 'DeepSeek R1',
    provider: 'DeepSeek',
    model: 'deepseek/deepseek-r1:free',
    type: 'free',
    tier: 'top',
    badge: 'Reasoning',
    apiProvider: 'openrouter',
    configured: true,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'llama-3-8b',
    label: 'Llama 3 8B',
    provider: 'Meta',
    model: 'meta-llama/llama-3-8b-instruct:free',
    type: 'free',
    tier: 'fast',
    badge: 'Fast',
    apiProvider: 'openrouter',
    configured: true,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'devstral',
    label: 'Devstral 2512',
    provider: 'Mistral',
    model: 'mistralai/devstral-2512:free',
    type: 'free',
    tier: 'top',
    badge: 'Free',
    apiProvider: 'openrouter',
    configured: true,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'qwen3',
    label: 'Qwen 3',
    provider: 'Qwen',
    model: 'qwen/qwen3-coder:free',
    type: 'free',
    tier: 'specialized',
    badge: 'Coding',
    apiProvider: 'openrouter',
    configured: true,
    fallbackId: 'gpt-oss-120b',
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
    apiProvider: 'openrouter',
    configured: false,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    provider: 'OpenAI',
    model: 'openai/gpt-4o-mini',
    type: 'paid',
    tier: 'budget',
    badge: 'Fast',
    apiProvider: 'openrouter',
    configured: false,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'claude-opus',
    label: 'Claude Opus',
    provider: 'Anthropic',
    model: 'anthropic/claude-opus-4-6',
    type: 'paid',
    tier: 'premium',
    badge: 'Powerful',
    apiProvider: 'openrouter',
    configured: false,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'claude-sonnet',
    label: 'Claude Sonnet',
    provider: 'Anthropic',
    model: 'anthropic/claude-sonnet-4-6',
    type: 'paid',
    tier: 'balanced',
    badge: 'Best',
    apiProvider: 'openrouter',
    configured: false,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'deepseek-chat',
    label: 'DeepSeek V3',
    provider: 'DeepSeek',
    model: 'deepseek/deepseek-chat',
    type: 'paid',
    tier: 'balanced',
    badge: 'Best',
    apiProvider: 'openrouter',
    configured: false,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'gemini-flash',
    label: 'Gemini Flash',
    provider: 'Google',
    model: 'google/gemini-flash-1.5',
    type: 'paid',
    tier: 'fast',
    badge: 'Fast',
    apiProvider: 'openrouter',
    configured: false,
    fallbackId: 'gpt-oss-120b',
  },

  // =========================
  // GEMINI via DIRECT GOOGLE API (PAID)
  // =========================

  {
    id: 'gemini-flash-v2',
    label: 'Gemini Flash',
    provider: 'Google Direct',
    model: 'gemini-2.5-flash',
    type: 'paid',
    tier: 'fast',
    badge: 'Fast',
    apiProvider: 'gemini',
    configured: true,
    fallbackId: 'gemini-flash-v2',
  },
  {
    id: 'gemini-pro-v2',
    label: 'Gemini Pro',
    provider: 'Google Direct',
    model: 'gemini-2.5-pro',
    type: 'paid',
    tier: 'premium',
    badge: 'Google',
    apiProvider: 'gemini',
    configured: false,
    fallbackId: 'gpt-oss-120b',
  },

  // =========================
  // CLAUDE CODE via FREEMODEL (PROXY)
  // =========================

  {
    id: 'freemodel-claude-sonnet',
    label: 'Claude Sonnet (Code)',
    provider: 'Freemodel Proxy',
    model: 'claude-sonnet-4-6',
    type: 'paid',
    tier: 'premium',
    badge: 'Claude Code',
    apiProvider: 'freemodel',
    configured: false,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'freemodel-claude-haiku',
    label: 'Claude Haiku (Code)',
    provider: 'Freemodel Proxy',
    model: 'claude-haiku-4-5-20251001',
    type: 'paid',
    tier: 'fast',
    badge: 'Claude Code',
    apiProvider: 'freemodel',
    configured: false,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'freemodel-claude-opus',
    label: 'Claude Opus (Code)',
    provider: 'Freemodel Proxy',
    model: 'claude-opus-4-6',
    type: 'paid',
    tier: 'premium',
    badge: 'Claude Code',
    apiProvider: 'freemodel',
    configured: false,
    fallbackId: 'gpt-oss-120b',
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
// GET API PROVIDER
// =========================

export const getModelApiProvider = (modelId) => {
  const entry = MODEL_REGISTRY.find(m => m.id === modelId);
  return entry?.apiProvider || 'openrouter';
};

// =========================
// CHECK IF PROVIDER IS CONFIGURED
// =========================

const isProviderConfigured = (apiProvider) => {
  try {
    if (apiProvider === 'freemodel') {
      return !!(process.env.FREEMODEL_API_KEY);
    }
    if (apiProvider === 'openrouter') {
      return !!(process.env.OPENROUTER_API_KEY);
    }
    if (apiProvider === 'gemini') {
      return !!(process.env.GEMINI_API_KEY);
    }
    return true;
  } catch {
    return false;
  }
};

// =========================
// GROUP FOR DROPDOWN (with configured flag)
// =========================

export const getGroupedModels = () => {
  const enrich = (m) => {
    const providerConfigured = isProviderConfigured(m.apiProvider || 'openrouter');
    const isConfigured = m.configured !== false && providerConfigured;
    return {
      ...m,
      configured: isConfigured,
    };
  };

  return {
    free: MODEL_REGISTRY.filter(m => m.type === 'free').map(enrich),
    paid: MODEL_REGISTRY.filter(m => m.type === 'paid').map(enrich),
  };
};

// =========================
// GET FALLBACK MODEL
// =========================

export const getFallbackForModel = (modelId) => {
  const entry = MODEL_REGISTRY.find(m => m.id === modelId);
  if (entry?.fallbackId) {
    const fallback = getGroupedModels();
    const allModels = [...fallback.free, ...fallback.paid];
    const fb = allModels.find(m => m.id === entry.fallbackId);
    if (fb && fb.configured) return fb;
  }
  const fb = getGroupedModels();
  const firstConfiguredPaid = fb.paid.find(m => m.configured);
  return firstConfiguredPaid || null;
};