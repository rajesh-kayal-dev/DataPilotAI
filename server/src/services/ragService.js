import { generateEmbedding } from '../utils/embedding.js';
import Document from '../models/Document.js';

export const chunkAndEmbed = (text) => {
  // Simple chunking: Split by paragraphs (improve later)
  const chunks = text.split('\n\n').filter(chunk => chunk.trim().length > 0);

  return chunks.map(chunk => ({
    content: chunk,
    embedding: generateEmbedding(chunk),
  }));
};

// Mock function to find similar embeddings (replace with real vector search)
const findSimilarChunks = async (queryEmbedding) => {
  // In a real app, use a vector DB (e.g., Pinecone, Weaviate) or MongoDB's $vectorSearch
  const documents = await Document.find({ status: 'processed' });
  let allChunks = [];
  documents.forEach(doc => allChunks.push(...doc.chunks));

  // Mock: Return chunks with embeddings "close" to the query
  return allChunks.slice(0, 3); // Return top 3 chunks (simplified)
};

export const retrieveContext = async (query) => {
  // TODO: Generate embedding for the query (use the same embedding model)
  const queryEmbedding = generateEmbedding(query);

  // Retrieve relevant chunks
  const chunks = await findSimilarChunks(queryEmbedding);
  return chunks.map(chunk => chunk.content).join('\n\n');
};