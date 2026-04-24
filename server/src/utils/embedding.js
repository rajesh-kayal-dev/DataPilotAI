import axios from 'axios';
import { config } from '../config/env.js';

const EMBEDDING_URL = `${config.ollama.baseUrl}/api/embeddings`;

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
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.embedding;

  } catch (error) {
    const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('OLLAMA ERROR:', errorDetails);
    throw new Error(`Bad Request or Failed: ${errorDetails}`);
  }
};