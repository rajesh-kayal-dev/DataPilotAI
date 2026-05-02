import { generateEmbedding } from '../services/embeddingService.js';
import { searchVectors } from '../services/vectorService.js';
import { config } from '../config/env.js';
import { calculateConfidence } from '../utils/confidenceScore.js';
import Document from '../models/Document.js';

/**
 * Research Agent (Production V5)
 * - Intelligent source attribution: Returns only the names of documents that actually matched the query.
 */
export const retrieveContext = async (question, documentIds, isSummary = false) => {
  // 0. Fetch Document Metadata
  const docsMetadata = await Document.find({ _id: { $in: documentIds } }).select('name');
  const docNamesMap = docsMetadata.reduce((acc, doc) => {
    acc[doc._id.toString()] = doc.name;
    return acc;
  }, {});
  
  const allDocNames = docsMetadata.length > 0 ? docsMetadata.map(d => d.name).join(', ') : 'Workspace Documents';

  // 1. Handle Summary / Meta Queries
  if (isSummary && documentIds.length === 1) {
    const documentId = documentIds[0];
    const { getCachedResponse, setCachedResponse } = await import('../utils/cache.js');
    const { getAllDocumentContext } = await import('../services/vectorService.js');
    
    const cacheKey = `cache:full_doc:${documentId}`;
    let fullDocText = await getCachedResponse(cacheKey);
    
    if (!fullDocText) {
      fullDocText = await getAllDocumentContext(documentId);
      await setCachedResponse(cacheKey, fullDocText, 86400);
    }

    const context = `[SOURCE DOCUMENT: ${allDocNames}]\n\n[FULL CONTENT]\n${fullDocText}`;
    
    return {
      context,
      confidence: 0.99,
      alignment: 1,
      isReliable: true,
      docNames: allDocNames, // For summaries, we use the specific doc name
      chunks: ['Analyzed full document from memory cache']
    };
  }

  // 2. Vector Search
  const queryEmbedding = await generateEmbedding(question);
  const rawResults = await searchVectors(queryEmbedding, documentIds);

  // 3. Dynamic Filtering
  const threshold = config.rag.threshold;
  let filtered = rawResults.filter(item => item.score >= threshold);
  let finalChunks = filtered.slice(0, config.rag.topK);
  
  // 4. Global Context Injection (Theme)
  const globalChunks = rawResults.filter(item => item.chunkIndex === 0 || item.chunkIndex === 1);
  const themeContext = globalChunks.length > 0 ? globalChunks[0].content : '';

  // 5. Confidence Calculation
  const confidence = calculateConfidence(question, finalChunks);

  // 6. Source Attribution: Get only the unique names of documents that provided chunks
  const matchedDocIds = [...new Set(finalChunks.map(item => item.docId))];
  const matchedDocNames = matchedDocIds.length > 0 
    ? matchedDocIds.map(id => docNamesMap[id]).filter(Boolean).join(', ')
    : '';

  // 7. Format Context with Specific Source Labels for LLM
  const formattedChunks = finalChunks.map(item => {
    const sourceName = docNamesMap[item.docId] || 'Unknown Document';
    return `[SOURCE: ${sourceName}]\n${item.content.trim()}`;
  }).join('\n\n---\n\n');

  const context = `[AVAILABLE SOURCES: ${allDocNames}]\n` +
                  (themeContext ? `[THEME OVERVIEW]: ${themeContext.substring(0, 300)}...\n\n` : '') + 
                  formattedChunks;

  const snippets = finalChunks.map(item => {
    const text = item.content.trim();
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  });

  return {
    context,
    confidence: confidence.score,
    alignment: confidence.alignment,
    isReliable: confidence.isReliable,
    docNames: matchedDocNames || allDocNames, // Prefer specific matched names
    hasMatchedChunks: finalChunks.length > 0,
    chunks: snippets
  };
};