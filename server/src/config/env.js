import 'dotenv/config';

/**
 * Production-Ready Configuration Suite
 * Single source of truth for all environment variables.
 */
export const config = {
  env: process.env.NODE_ENV || 'development',
  
  server: {
    port: process.env.PORT || 5000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  },

  db: {
    mongoUri: process.env.MONGODB_URI,
    redisUrl: process.env.REDIS_URL
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpires: process.env.JWT_EXPIRES_IN
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    embedModel: process.env.EMBED_MODEL || 'nomic-embed-text'
  },

  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
    collection: process.env.QDRANT_COLLECTION || 'documents'
  },

  limits: {
    rateWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60,
    rateMax: parseInt(process.env.RATE_LIMIT_MAX) || 30,
    dailyQuota: parseInt(process.env.DAILY_QUOTA) || 200
  },

  rag: {
    mode: process.env.RAG_MODE || 'strict', // Added RAG_MODE support
    threshold: parseFloat(process.env.RAG_THRESHOLD) || 0.45,
    alignment: parseFloat(process.env.RAG_ALIGNMENT_THRESHOLD) || 0.35,
    topK: parseInt(process.env.RAG_TOP_K) || 5,
    minChars: 150
  },

  llm: {
    timeout: parseInt(process.env.LLM_TIMEOUT) || 20000,
    retries: parseInt(process.env.MAX_RETRIES) || 3,
    maxTokens: parseInt(process.env.MAX_TOKENS) || 500,
    temperature: parseFloat(process.env.TEMPERATURE) || 0.2
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    fastModel: process.env.FAST_MODEL,
    chatModel: process.env.CHAT_MODEL,
    smartModel: process.env.SMART_MODEL,
    fallbackModel: process.env.FALLBACK_MODEL
  }
};