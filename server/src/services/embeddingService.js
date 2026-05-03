import axios from 'axios';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Embedding Service (Production V2 - Resilient)
 * Generates vector embeddings via OpenRouter with retry + graceful fallback.
 */

const EMBEDDING_URL = `${config.openrouter.baseUrl}/embeddings`;

// Transient errors that are safe to retry
const RETRYABLE_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ERR_NETWORK']);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Generates an embedding for the given text using OpenRouter.
 * Retries up to 2 times on transient network errors before giving up.
 * @param {string} text - Input text
 * @returns {Promise<Array<number>>} - Vector embedding
 * @throws {Error} if all retries fail
 */
export const generateEmbedding = async (text, retries = 2) => {
  if (!text || text.trim().length === 0) {
    throw new Error('Empty text for embedding');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        EMBEDDING_URL,
        {
          model: config.ollama.embedModel,
          input: text
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openrouter.apiKey}`
          },
          timeout: 10000 // 10s hard timeout per attempt
        }
      );

      return response.data.data[0].embedding;

    } catch (error) {
      const code = error.code || error.cause?.code;
      const isTransient = RETRYABLE_CODES.has(code) || error.message?.includes('ECONNRESET');

      if (isTransient && attempt < retries) {
        // Exponential backoff: 300ms, 600ms
        await sleep(300 * (attempt + 1));
        continue;
      }

      const detail = error.response ? JSON.stringify(error.response.data) : error.message;
      logger.error('Embedding Error', { error: detail });
      throw new Error('Failed to generate embedding');
    }
  }
};
