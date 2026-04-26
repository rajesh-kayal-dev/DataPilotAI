import axios from 'axios';
import { config } from '../config/env.js';

/**
 * Embedding Service
 * Responsible for converting text into vector embeddings using Ollama.
 */

const EMBEDDING_URL = `${config.ollama.baseUrl}/api/embeddings`;

/**
 * Generates an embedding for the given text.
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
        model: config.ollama.embedModel,
        prompt: text
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return response.data.embedding;

  } catch (error) {
    const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('Ollama Embedding Error:', errorDetails);
    throw new Error('Failed to generate embedding');
  }
};
