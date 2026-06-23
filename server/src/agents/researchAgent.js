import { generateEmbedding } from '../services/embeddingService.js';
import { searchVectors } from '../services/vectorService.js';
import { config } from '../config/env.js';
import { calculateConfidence } from '../utils/confidenceScore.js';
import Document from '../models/Document.js';

/**
 * Research Agent (Production V5)
 * - Intelligent source attribution: Returns only the names of documents that actually matched the query.
 */
export const retrieveContext = async (question, documentIds, isSummary = false, includeChunkMeta = false, workspaceId = null, userId = null) => {
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
        chunks: ['Analyzed full document from memory cache'],
        chunkMeta: [],
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

      const multiChunkMeta = includeChunkMeta ? summaryChunks.slice(0, 5).map(c => ({
        docName: docNamesMap[c.docId] || 'Document',
        score: c.score || 0,
        chunkIndex: c.chunkIndex ?? 0,
        content: (c.content || '').trim().substring(0, 200),
      })) : [];

      return {
        context: `[SUMMARY DATA FROM MULTIPLE SOURCES: ${allDocNames}]\n\n${formatted}`,
        confidence: 0.9,
        alignment: 1,
        isReliable: true,
        docNames: allDocNames,
        hasMatchedChunks: summaryChunks.length > 0,
        chunks: summaryChunks.slice(0, 5).map(c => c.content.substring(0, 100)),
        chunkMeta: multiChunkMeta,
      };
    }
  }

  // 2. Vector Search
  let queryEmbedding;
  try {
    queryEmbedding = await generateEmbedding(question);
  } catch {
    // Embedding failed — return empty context so orchestrator uses general knowledge fallback
    return { context: '', confidence: 0, alignment: 0, isReliable: false, docNames: allDocNames, hasMatchedChunks: false, chunks: [], chunkMeta: [] };
  }
  const rawResults = await searchVectors(queryEmbedding, documentIds);

  // 3. Two-Tier Dynamic Filtering + Reranking
  // Tier 1: Strict threshold (config.rag.threshold = 0.65)
  // Tier 2: Loose threshold (0.4) — prevents false rejections when chunks are relevant but scored lower
  const strictThreshold = config.rag.threshold;
  const looseThreshold = 0.3;
  let candidates = rawResults.filter(item => item.score >= looseThreshold);
  let finalChunks = [];

  if (candidates.length > 0) {
    // Rerank ALL candidates by combined vector + semantic alignment
    const { calculateAlignment } = await import('../utils/alignmentCheck.js');
    const reranked = candidates.map(chunk => {
      const alignmentScore = calculateAlignment(question, [chunk]);
      const rerankScore = (chunk.score * 0.4) + (alignmentScore * 0.6);
      return { ...chunk, alignmentScore, rerankScore };
    });
    reranked.sort((a, b) => b.rerankScore - a.rerankScore);

    // Take topK, preferring chunks above strict threshold
    const highQuality = reranked.filter(c => c.score >= strictThreshold);
    const lowQuality = reranked.filter(c => c.score < strictThreshold);

    if (highQuality.length >= config.rag.topK) {
      finalChunks = highQuality.slice(0, config.rag.topK);
    } else {
      // Mix high + low quality, but penalize low-quality chunk scores for confidence
      finalChunks = [...highQuality, ...lowQuality].slice(0, config.rag.topK);
    }

    const avgRerank = finalChunks.reduce((s, c) => s + c.rerankScore, 0) / finalChunks.length;
    const avgVector = finalChunks.reduce((s, c) => s + c.score, 0) / finalChunks.length;
    const belowThreshold = finalChunks.filter(c => c.score < strictThreshold).length;
    console.log(`Rerank: ${finalChunks.length} chunks (${belowThreshold} below ${strictThreshold}), avg vector=${avgVector.toFixed(3)}, avg rerank=${avgRerank.toFixed(3)}`);
  }

  // 5b. Last-resort fallback: use raw top results (no threshold) if filtering got nothing
  if (finalChunks.length === 0 && rawResults.length > 0) {
    finalChunks = rawResults.slice(0, config.rag.topK).map(c => ({
      ...c,
      alignmentScore: 0,
      rerankScore: c.score,
    }));
    console.log(`Fallback: using top ${finalChunks.length} raw results (lowest score: ${finalChunks[finalChunks.length-1].score.toFixed(3)})`);
  }

  // 5c. Global Workspace Fallback (User Request): If no chunks found, search all documents in workspace
  if (finalChunks.length === 0 && workspaceId && userId) {
    console.log('No relevant chunks found in active document, falling back to all workspace documents');
    const allDocs = await Document.find({ workspaceId, userId, status: 'completed' }).select('_id name');
    const allDocIds = allDocs.map(d => d._id.toString());
    
    if (allDocIds.length > 0) {
      const globalRawResults = await searchVectors(queryEmbedding, allDocIds);
      const globalCandidates = globalRawResults.filter(item => item.score >= looseThreshold);
      
      if (globalCandidates.length > 0) {
        const { calculateAlignment } = await import('../utils/alignmentCheck.js');
        const reranked = globalCandidates.map(chunk => {
          const alignmentScore = calculateAlignment(question, [chunk]);
          const rerankScore = (chunk.score * 0.4) + (alignmentScore * 0.6);
          return { ...chunk, alignmentScore, rerankScore };
        });
        reranked.sort((a, b) => b.rerankScore - a.rerankScore);
        finalChunks = reranked.slice(0, config.rag.topK);
        
        // Update docNamesMap with the new docs
        allDocs.forEach(doc => {
          docNamesMap[doc._id.toString()] = doc.name;
        });
      }
    }
  }

  // 5. Global Context Injection (Theme)
  const globalChunks = rawResults.filter(item => item.chunkIndex === 0 || item.chunkIndex === 1);
  const themeContext = globalChunks.length > 0 ? globalChunks[0].content : '';

  // 6. Confidence Calculation
  const confidence = calculateConfidence(question, finalChunks);

  // 7. Source Attribution: Get only the unique names of documents that provided chunks
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

  const chunkMeta = includeChunkMeta ? finalChunks.slice(0, 5).map(item => ({
    docName: docNamesMap[item.docId] || 'Unknown Document',
    score: item.score || 0,
    chunkIndex: item.chunkIndex ?? 0,
    content: (item.content || '').trim().substring(0, 200),
  })) : [];

  return {
    context,
    confidence: confidence.score,
    alignment: confidence.alignment,
    isReliable: confidence.isReliable,
    docNames: matchedDocNames || allDocNames,
    hasMatchedChunks: finalChunks.length > 0,
    chunks: snippets,
    chunkMeta,
  };
};