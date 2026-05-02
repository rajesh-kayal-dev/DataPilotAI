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
          size: 2048,
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
export const searchVectors = async (vector, documentIds) => {
  try {
    const searchParams = {
      vector,
      limit: config.rag.topK, // Dynamic limit from config
    };

    // Filter by specific documents if IDs provided
    if (documentIds && documentIds.length > 0) {
      searchParams.filter = {
        must: [{ key: 'docId', match: { any: documentIds.map(String) } }],
      };
    }

    await ensureCollection();
    const results = await client.search(COLLECTION_NAME, searchParams);

    return results.map(item => ({
      score: item.score,
      content: item.payload?.content,
      docId: item.payload?.docId,
      chunkIndex: item.payload?.chunkIndex
    }));
  } catch (error) {
    console.error('Vector DB Search Error:', error.message);
    throw error;
  }
};

/**
 * Retrieves ALL chunks for a document to provide a full-document scan.
 */
export const getAllDocumentContext = async (documentId) => {
  try {
    await ensureCollection();
    const results = await client.scroll(COLLECTION_NAME, {
      filter: {
        must: [{ key: 'docId', match: { value: documentId } }],
      },
      limit: 100, // Reasonable limit to prevent memory overflow
      with_payload: true,
      with_vector: false
    });
    
    // Sort by chunk index to maintain narrative order
    const points = results.points || [];
    return points
      .sort((a, b) => (a.payload?.chunkIndex || 0) - (b.payload?.chunkIndex || 0))
      .map(item => item.payload?.content)
      .join('\n\n');
  } catch (error) {
    console.error('Vector DB Scroll Error:', error.message);
    return '';
  }
};


/**
 * Deletes vectors belonging to a specific document.
 */
export const deleteVectorsByDocId = async (documentId) => {
  try {
    await ensureCollection();
    return await client.delete(COLLECTION_NAME, {
      filter: {
        must: [{ key: 'docId', match: { value: documentId } }],
      },
    });
  } catch (error) {
    if (error.message?.includes('Not Found') || error.status === 404) {
      return { success: true, message: 'Collection or vectors already empty' };
    }
    console.error('Vector DB Delete Error:', error.message);
    // Don't throw for deletion errors to allow re-indexing to continue
    return { success: false, error: error.message };
  }
};
