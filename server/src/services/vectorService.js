import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config/env.js';

/**
 * Vector Service
 * Responsible for all interactions with the Qdrant Vector Database.
 */

const client = new QdrantClient({
  url: config.qdrant.url,
});

const COLLECTION_NAME = config.qdrant.collection;

/**
 * Ensures the Qdrant collection exists.
 */
export const ensureCollection = async () => {
  try {
    const collections = await client.getCollections();
    const exists = collections?.collections?.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 768, // Matches nomic-embed-text
          distance: 'Cosine',
        },
      });
    }
  } catch (error) {
    console.error('Vector DB Collection Error:', error.message);
  }
};

/**
 * Inserts vector points into the database.
 */
export const insertVectors = async (points) => {
  try {
    await ensureCollection();
    return await client.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });
  } catch (error) {
    console.error('Vector DB Insert Error:', error.message);
    throw error;
  }
};

/**
 * Searches for the most similar vectors.
 */
export const searchVectors = async (vector, documentId) => {
  try {
    const searchParams = {
      vector,
      limit: config.rag.topK, // Dynamic limit from config
    };

    // Filter by specific document if ID provided
    if (documentId) {
      searchParams.filter = {
        must: [{ key: 'docId', match: { value: documentId } }],
      };
    }

    const results = await client.search(COLLECTION_NAME, searchParams);

    return results.map(item => ({
      score: item.score,
      content: item.payload?.content,
      docId: item.payload?.docId,
    }));
  } catch (error) {
    console.error('Vector DB Search Error:', error.message);
    throw error;
  }
};

/**
 * Deletes vectors belonging to a specific document.
 */
export const deleteVectorsByDocId = async (documentId) => {
  try {
    return await client.delete(COLLECTION_NAME, {
      filter: {
        must: [{ key: 'docId', match: { value: documentId } }],
      },
    });
  } catch (error) {
    console.error('Vector DB Delete Error:', error.message);
    throw error;
  }
};
