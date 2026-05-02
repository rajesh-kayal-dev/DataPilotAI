import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Vector Service (Production V9)
 * - Enhanced multi-document filtering with 'should' blocks.
 * - Strict Mode Compliance: Ensures payload indexes exist for filtered fields.
 */

const client = new QdrantClient({
  url: config.qdrant.url,
  apiKey: config.qdrant.apiKey,
});

const COLLECTION_NAME = config.qdrant.collection;

/**
 * Ensures the Qdrant collection exists and payload indexes are configured.
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
      logger.info(`Created new vector collection: ${COLLECTION_NAME}`);
    }

    // Critical for Qdrant Cloud / Strict Mode: Create index for docId
    // This prevents 'Bad Request' errors when filtering by document IDs
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: "docId",
      field_schema: "keyword",
      wait: true
    });

  } catch (error) {
    // Silently continue if index already exists
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
      limit: config.rag.topK || 4,
      with_payload: true,
    };

    if (documentIds && documentIds.length > 0) {
      const cleanIds = Array.isArray(documentIds) 
        ? documentIds.map(id => id.toString()) 
        : [documentIds.toString()];
      
      searchParams.filter = {
        should: cleanIds.map(id => ({
          key: "docId",
          match: { value: id }
        }))
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
 * Retrieves ALL chunks for a document.
 */
export const getAllDocumentContext = async (documentId) => {
  try {
    const docIdStr = documentId.toString();
    await ensureCollection();
    const results = await client.scroll(COLLECTION_NAME, {
      filter: {
        must: [{ key: 'docId', match: { value: docIdStr } }],
      },
      limit: 100,
      with_payload: true,
      with_vector: false
    });
    
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
    const docIdStr = documentId.toString();
    await ensureCollection();
    return await client.delete(COLLECTION_NAME, {
      filter: {
        must: [{ key: 'docId', match: { value: docIdStr } }],
      },
    });
  } catch (error) {
    if (error.message?.includes('Not Found') || error.status === 404) {
      return { success: true };
    }
    console.error('Vector DB Delete Error:', error.message);
    return { success: false, error: error.message };
  }
};
