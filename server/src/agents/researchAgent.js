import { generateEmbedding } from '../services/embeddingService.js';
import { searchVectors } from '../services/vectorService.js';
import { config } from '../config/env.js';
import { calculateConfidence } from '../utils/confidenceScore.js';

/**
 * Research Agent (Production V3)
 * Handles semantic search with dynamic thresholds based on intent.
 */
export const retrieveContext = async (question, documentId, isSummary = false) => {
  // 1. Vector Search
  const queryEmbedding = await generateEmbedding(question);
  const rawResults = await searchVectors(queryEmbedding, documentId);

  // 2. Dynamic Filtering
  // For summaries/overviews, we are more generous (lower threshold)
  const threshold = isSummary ? 0.3 : config.rag.threshold;
  let filtered = rawResults.filter(item => item.score >= threshold);

  // 3. Diversity Filtering for Summaries
  let finalChunks = [];
  if (isSummary) {
    const topK = config.rag.topK * 2;
    const pool = filtered.slice(0, topK);
    
    pool.forEach(chunk => {
      const isDuplicate = finalChunks.some(f => 
        f.content.substring(0, 50) === chunk.content.substring(0, 50)
      );
      if (!isDuplicate && finalChunks.length < config.rag.topK) {
        finalChunks.push(chunk);
      }
    });
  } else {
    finalChunks = filtered.slice(0, config.rag.topK);
  }

  // 4. Advanced Scoring
  const confidence = calculateConfidence(question, finalChunks);

  // 5. Format Output
  const context = finalChunks.map(item => item.content.trim()).join('\n\n');
  const snippets = finalChunks.map(item => {
    const text = item.content.trim();
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  });

  return {
    context,
    confidence: confidence.score,
    alignment: confidence.alignment,
    isReliable: confidence.isReliable,
    chunks: snippets
  };
};