import 'dotenv/config';

export const config = {
  port: process.env.PORT || 5000,

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL,
    embedModel: process.env.EMBED_MODEL,
    chatModel: process.env.CHAT_MODEL,
  },

  qdrant: {
    url: process.env.QDRANT_URL,
    collection: process.env.QDRANT_COLLECTION,
  },
  
};