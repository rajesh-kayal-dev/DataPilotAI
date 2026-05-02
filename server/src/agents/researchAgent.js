import { generateEmbedding } from '../services/embeddingService.js';
import { searchVectors } from '../services/vectorService.js';
import { config } from '../config/env.js';
import { calculateConfidence } from '../utils/confidenceScore.js';
import Document from '../models/Document.js';

/**
 * Research Agent (Production V3)
 * Handles semantic search with dynamic thresholds based on intent.
 */
export const retrieveContext = async (question, documentIds, isSummary = false) => {
  // 0. Fetch Document Metadata for "Global Awareness"
  // Since we might be searching across multiple docs, we get a comma separated list of names
  const docsMetadata = await Document.find({ _id: { $in: documentIds } }).select('name');
  const docNames = docsMetadata.length > 0 ? docsMetadata.map(d => d.name).join(', ') : 'Workspace Documents';

  // 1. Handle Summary / Meta Queries (FULL DOCUMENT SCAN & CACHE)
  if (isSummary && documentIds.length === 1) {
    const documentId = documentIds[0];
    const { getCachedResponse, setCachedResponse } = await import('../utils/cache.js');
    const { getAllDocumentContext } = await import('../services/vectorService.js');
    
    const cacheKey = `cache:full_doc:${documentId}`;
    let fullDocText = await getCachedResponse(cacheKey);
    
    if (!fullDocText) {
      // First time: Scan whole document
      fullDocText = await getAllDocumentContext(documentId);
      // Store in memory database (Redis)
      await setCachedResponse(cacheKey, fullDocText, 86400); // Cache for 24 hours
    }

    const context = `[DOCUMENT NAME: ${docNames}]\n[FULL DOCUMENT TEXT]\n${fullDocText}`;
    
    return {
      context,
      confidence: 0.99, // High confidence since we read the whole file
      alignment: 1,
      isReliable: true,
      chunks: ['Analyzed full document from memory cache']
    };
  } else if (isSummary && documentIds.length > 1) {
      // For multi-document summaries, vector search is required. We'll skip the full-doc read to save tokens.
      // Continue to vector search below
  }

  // 2. Vector Search for Specific Questions
  const queryEmbedding = await generateEmbedding(question);
  const rawResults = await searchVectors(queryEmbedding, documentIds);

  // 3. Dynamic Filtering
  const threshold = config.rag.threshold;
  let filtered = rawResults.filter(item => item.score >= threshold);

  // 4. Diversity Filtering
  let finalChunks = filtered.slice(0, config.rag.topK);
  
  // 5. Global Context Injection: Always get the first chunk to understand the document theme
  const globalChunks = rawResults.filter(item => item.chunkIndex === 0 || item.chunkIndex === 1);
  const themeContext = globalChunks.length > 0 ? globalChunks[0].content : '';


  // 4. Advanced Scoring
  const confidence = calculateConfidence(question, finalChunks);

  // 5. Format Output
  // Include Factual Document Name and Global Theme at the top of context
  const context = `[DOCUMENT NAME: ${docNames}]\n` +
                  (themeContext ? `[DOCUMENT THEME (CHUNK 0): ${themeContext.substring(0, 300)}...]\n\n` : '') + 
                  finalChunks.map(item => item.content.trim()).join('\n\n');
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