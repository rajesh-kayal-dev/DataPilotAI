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
  checkCompatibility: false,
});

const COLLECTION_NAME = config.qdrant.collection;

let qdrantAvailable = true;

/**
 * Ensures the Qdrant collection exists and payload indexes are configured.
 */
export const ensureCollection = async () => {
  if (!qdrantAvailable) return;
  try {
    const collections = await client.getCollections();
    logger.info('Qdrant connected successfully');
    const exists = collections?.collections?.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 768,
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
    qdrantAvailable = false;
    logger.error('Qdrant unavailable - RAG features disabled', { error: error.message, url: config.qdrant.url });
  }
};

/**
 * Inserts vector points into the database.
 */
export const insertVectors = async (points) => {
  if (!qdrantAvailable) {
    logger.warn('Qdrant unavailable - skipping vector insertion');
    return { success: true, skipped: true };
  }
  try {
    await ensureCollection();
    if (!qdrantAvailable) {
      return { success: true, skipped: true };
    }
    return await client.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });
  } catch (error) {
    qdrantAvailable = false;
    logger.error('Vector DB Insert Error', { error: error.message });
    return { success: true, skipped: true };
  }
};

/**
 * Searches for the most similar vectors.
 */
export const searchVectors = async (vector, documentIds) => {
  if (!qdrantAvailable) {
    return [];
  }
  try {
    const searchParams = {
        vector,
        limit: 50,
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
    if (!qdrantAvailable) return [];
    const results = await client.search(COLLECTION_NAME, searchParams);

    return results.map(item => ({
      score: item.score,
      content: item.payload?.content,
      docId: item.payload?.docId,
      chunkIndex: item.payload?.chunkIndex
    }));
  } catch (error) {
    console.error('Vector DB Search Error:', error.message);
    return [];
  }
};

/**
 * Retrieves ALL chunks for a document.
 */
export const getAllDocumentContext = async (documentId) => {
  if (!qdrantAvailable) return '';
  try {
    const docIdStr = documentId.toString();
    await ensureCollection();
    if (!qdrantAvailable) return '';
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
  if (!qdrantAvailable) return { success: true };
  try {
    const docIdStr = documentId.toString();
    await ensureCollection();
    if (!qdrantAvailable) return { success: true };
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
