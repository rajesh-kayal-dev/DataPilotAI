import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../../config/env.js';

const client = new QdrantClient({
  url: config.qdrant.url,
});

const COLLECTION_NAME = config.qdrant.collection;

export const createCollection = async () => {
  try {
    const collections = await client.getCollections();

    const exists = collections?.collections?.some(
      (c) => c.name === COLLECTION_NAME
    );

    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 768,
          distance: 'Cosine',
        },
      });
    }
  } catch (error) {
    console.error('Qdrant Create Collection Error:', error.message || error);
  }
};

export const insertVectors = async (points) => {
  try {
    await createCollection();

    return await client.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });
  } catch (error) {
    console.error('Qdrant Insert Error:', error.message || error);
    throw error;
  }
};

export const searchVectors = async (vector, documentId) => {
  try {
    const searchParams = {
      vector,
      limit: 5,
    };

    if (documentId) {
      searchParams.filter = {
        must: [
          {
            key: 'docId',
            match: {
              value: documentId,
            },
          },
        ],
      };
    }

    const results = await client.search(COLLECTION_NAME, searchParams);

    return results.map((item) => ({
      score: item.score,
      content: item.payload?.content,
      docId: item.payload?.docId,
    }));
  } catch (error) {
    console.error('Qdrant Search Error:', error.message || error);
    throw error;
  }
};

export const deleteVectors = async (documentId) => {
  try {
    return await client.delete(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'docId',
            match: {
              value: documentId,
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error('Qdrant Delete Error:', error.message || error);
    throw error;
  }
};