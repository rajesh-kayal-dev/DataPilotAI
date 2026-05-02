import axios from 'axios';
import { config } from '../config/env.js';

/**
 * Embedding Service
 * Responsible for converting text into vector embeddings using Ollama.
 */

const EMBEDDING_URL = `${config.openrouter.baseUrl}/embeddings`;

/**
 * Generates an embedding for the given text using OpenRouter.
 * @param {string} text - Input text
 * @returns {Promise<Array<number>>} - Vector embedding
 */
export const generateEmbedding = async (text) => {
  if (!text || text.trim().length === 0) {
    throw new Error('Empty text for embedding');
  }

  try {
    const response = await axios.post(
      EMBEDDING_URL,
      {
        model: config.ollama.embedModel, // We will update this in .env to an OpenRouter model
        input: text
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openrouter.apiKey}`
        }
      }
    );

    return response.data.data[0].embedding;

  } catch (error) {
    const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('OpenRouter Embedding Error:', errorDetails);
    throw new Error('Failed to generate embedding via OpenRouter');
  }
};
