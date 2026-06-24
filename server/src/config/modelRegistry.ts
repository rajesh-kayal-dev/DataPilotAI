/**
 * DataPilotAI — Central Model Registry (TypeScript version)
 *
 * Architecture rule: Groq is the PRIMARY provider. Groq models are listed
 * first and DEFAULT_MODEL_ID points to the top-tier Groq model.
 * OpenRouter / Gemini / Freemodel are optional — they gracefully degrade
 * to the Groq fallback when their API keys are absent.
 */

import type { ModelEntry, GroupedModels, LLMProvider } from '../types/index.js';

// =============================================================================
// MODEL REGISTRY
// =============================================================================

export const MODEL_REGISTRY: ModelEntry[] = [

  // ===========================
  // GROQ — PRIMARY PROVIDER (FREE, DIRECT API)
  // ===========================

  {
    id: 'groq-llama-70b',
    label: 'Llama 3.3 70B',
    provider: 'Groq',
    model: 'llama-3.3-70b-versatile',
    type: 'free',
    tier: 'top',
    badge: 'Fast',
    apiProvider: 'groq',
    configured: true,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'groq-llama-8b',
    label: 'Llama 3.1 8B',
    provider: 'Groq',
    model: 'llama3-8b-8192',
    type: 'free',
    tier: 'fast',
    badge: 'Instant',
    apiProvider: 'groq',
    configured: true,
    fallbackId: 'gpt-oss-120b',
  },
  {
    id: 'groq-qwen-32b',
    label: 'Qwen3 32B',
    provider: 'Groq',
    model: 'qwen/qwen3-32b',
    type: 'free',
    tier: 'specialized',
    badge: 'Reasoning',
    apiProvider: 'groq',
    configured: true,
    fallbackId: 'gpt-oss-120b',
  },

  // ===========================
  // OPENROUTER — FREE MODELS
  // ===========================

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

  // ===========================
  // OPENROUTER — PAID MODELS (PRO USERS)
  // ===========================

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

  // ===========================
  // GEMINI — DIRECT GOOGLE API (PAID)
  // ===========================

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

  // ===========================
  // FREEMODEL — CLAUDE CODE PROXY (PAID)
  // ===========================

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
  },

];

// =============================================================================
// DEFAULT MODEL — always a Groq model (primary provider)
// =============================================================================

export const DEFAULT_MODEL_ID = 'groq-llama-70b';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Resolves a model ID to the provider-specific model string used in API calls.
 * Falls back to the default model when `modelId` is unrecognised.
 */
export const resolveModel = (modelId: string): string | undefined => {
  const entry = MODEL_REGISTRY.find((m) => m.id === modelId);
  if (!entry) {
    const fallback = MODEL_REGISTRY.find((m) => m.id === DEFAULT_MODEL_ID);
    return fallback?.model;
  }
  return entry.model;
};

/** Returns true when `modelId` exists in the registry. */
export const isValidModel = (modelId: string): boolean =>
  MODEL_REGISTRY.some((m) => m.id === modelId);

/** Returns the full registry entry for `modelId`, or undefined. */
export const getModelInfo = (modelId: string): ModelEntry | undefined =>
  MODEL_REGISTRY.find((m) => m.id === modelId);

/**
 * Returns the API provider for `modelId`.
 * Defaults to `'openrouter'` when the model is not found.
 */
export const getModelApiProvider = (modelId: string): LLMProvider => {
  const entry = MODEL_REGISTRY.find((m) => m.id === modelId);
  return entry?.apiProvider ?? 'openrouter';
};

/**
 * Checks whether the API key for `apiProvider` is present in the environment.
 * Used by `getGroupedModels()` to compute the runtime `configured` flag.
 */
export const isProviderConfigured = (apiProvider: LLMProvider): boolean => {
  try {
    switch (apiProvider) {
      case 'groq':        return Boolean(process.env.GROQ_API_KEY);
      case 'openrouter':  return Boolean(process.env.OPENROUTER_API_KEY);
      case 'gemini':      return Boolean(process.env.GEMINI_API_KEY);
      case 'freemodel':   return Boolean(process.env.FREEMODEL_API_KEY);
      default:            return true;
    }
  } catch {
    return false;
  }
};

/**
 * Returns all models grouped by billing type, with the `configured` flag
 * enriched at runtime based on whether the provider's API key is present.
 * This is the primary data source for the model picker dropdown.
 */
export const getGroupedModels = (): GroupedModels => {
  const enrich = (m: ModelEntry): ModelEntry => {
    const providerConfigured = isProviderConfigured(m.apiProvider);
    return {
      ...m,
      configured: m.configured !== false && providerConfigured,
    };
  };

  return {
    free: MODEL_REGISTRY.filter((m) => m.type === 'free').map(enrich),
    paid: MODEL_REGISTRY.filter((m) => m.type === 'paid').map(enrich),
  };
};

/**
 * Returns the best available fallback model for `modelId`.
 *
 * Resolution order:
 *   1. The model's declared `fallbackId` if that model is currently configured.
 *   2. The first configured paid model across the whole registry.
 *   3. null — caller must handle this gracefully.
 */
export const getFallbackForModel = (modelId: string): ModelEntry | null => {
  const entry = MODEL_REGISTRY.find((m) => m.id === modelId);

  if (entry?.fallbackId) {
    const grouped = getGroupedModels();
    const allModels = [...grouped.free, ...grouped.paid];
    const fb = allModels.find((m) => m.id === entry.fallbackId);
    if (fb && fb.configured) return fb;
  }

  const grouped = getGroupedModels();
  const firstConfiguredPaid = grouped.paid.find((m) => m.configured);
  return firstConfiguredPaid ?? null;
};
