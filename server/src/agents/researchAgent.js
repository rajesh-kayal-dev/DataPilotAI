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
  if (isSummary && documentIds.length > 0) {
    const { getCachedResponse, setCachedResponse } = await import('../utils/cache.js');
    const { getAllDocumentContext } = await import('../services/vectorService.js');
    
    // For single doc, we use cached full content
    if (documentIds.length === 1) {
      const documentId = documentIds[0];
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
        docNames: allDocNames,
        chunks: ['Analyzed full document from memory cache']
      };
    } else {
      // For multiple docs, we take a larger sample of chunks (Top 20) to ensure a good summary
      let queryEmbedding;
      try {
        queryEmbedding = await generateEmbedding(question);
      } catch {
        return { context: '', confidence: 0, alignment: 0, isReliable: false, docNames: allDocNames, hasMatchedChunks: false, chunks: [] };
      }
      const rawResults = await searchVectors(queryEmbedding, documentIds);
      const topK_Summary = 20;
      const summaryChunks = rawResults.slice(0, topK_Summary);

      const formatted = summaryChunks.map(item => {
        const sourceName = docNamesMap[item.docId] || 'Document';
        return `[SOURCE: ${sourceName}]\n${item.content.trim()}`;
      }).join('\n\n---\n\n');

      return {
        context: `[SUMMARY DATA FROM MULTIPLE SOURCES: ${allDocNames}]\n\n${formatted}`,
        confidence: 0.9,
        alignment: 1,
        isReliable: true,
        docNames: allDocNames,
        hasMatchedChunks: summaryChunks.length > 0,
        chunks: summaryChunks.slice(0, 5).map(c => c.content.substring(0, 100))
      };
    }
  }

  // 2. Vector Search
  let queryEmbedding;
  try {
    queryEmbedding = await generateEmbedding(question);
  } catch {
    // Embedding failed — return empty context so orchestrator uses general knowledge fallback
    return { context: '', confidence: 0, alignment: 0, isReliable: false, docNames: allDocNames, hasMatchedChunks: false, chunks: [] };
  }
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