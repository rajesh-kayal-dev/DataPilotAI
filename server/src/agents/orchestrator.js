import { retrieveContext } from './researchAgent.js';
import { generateAnswer } from './chatAgent.js';
import { config } from '../config/env.js';
import { detectIntent } from '../utils/intentDetector.js';
import { checkRateLimit } from '../utils/rateLimiter.js';
import { getCacheKey, getCachedResponse, setCachedResponse } from '../utils/cache.js';
import { trackMetrics } from '../utils/analytics.js';
import { logger } from '../utils/logger.js';
import { isValidModel, resolveModel } from '../config/modelRegistry.js';
import User from '../models/User.js';

/**
 * Orchestrator (Production V7 - With Memory)
 * Uses RAG_MODE to control strict vs hybrid answering behavior.
 */
export const processChatFlow = async (question, documentIds, userId, options = {}) => {
  const startTime = Date.now();
  const { onStream, workspaceId, history = [] } = options;

  // Ensure documentIds is an array
  const docIdsArray = Array.isArray(documentIds) ? documentIds : (documentIds ? [documentIds] : []);
  const hasDocuments = docIdsArray.length > 0;

  try {
    // 1. Resolve Mode early for logging and logic
    const mode = options.mode || config.rag.mode || 'hybrid';

    // 2. Rate Limiting & Daily Quota
    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.allowed) return { success: false, error: rateLimit.message };

    // 3. Caching (Production Only)
    const cacheKey = getCacheKey(question, docIdsArray.join(','));
    if (!onStream && !options.regenerate && config.env === 'production') {
      const cached = await getCachedResponse(cacheKey);
      if (cached) return { ...cached, cached: true, responseTime: Date.now() - startTime };
    }

    // 4. Intent Detection & Logging
    const intent = detectIntent(question);
    const isSummaryQuery = /summarize|summary|overview|key points|explain document/i.test(question);
    
    // 4.5 Document-Check Guardrail (Requested Feature)
    // If user asks for summary/doc analysis but has NOT uploaded any documents
    const isDocRelatedQuery = intent === 'doc_summary' || isSummaryQuery;
    if (isDocRelatedQuery && !hasDocuments) {
      const guardrailMsg = "Sorry, but you are not providing any document. Please upload a document.";
      logger.info('Guardrail triggered: Doc query without documents', { userId });
      
      if (onStream) {
        onStream(guardrailMsg);
        return { success: true, answer: guardrailMsg, model: 'system', source: 'System Guardrail' };
      }
      
      return {
        success: true,
        answer: guardrailMsg,
        model: 'system',
        source: 'System Guardrail'
      };
    }


    if (intent === 'workspace_info' && workspaceId) {
      try {
        const Workspace = (await import('../models/Workspace.js')).default;
        const ws = await Workspace.findById(workspaceId);
        if (ws) {
          return { success: true, answer: `You are currently in the workspace: "${ws.name}".`, model: 'system', source: 'Internal' };
        }
      } catch (err) {
        logger.error('Workspace Info Error', { err });
      }
    }

    // 4. Retrieval & Scoring
    let context = '';
    let confidence = 0;
    let alignment = 0;
    let isReliable = false;
    let chunks = [];

    let docNames = '';
    let hasMatchedChunks = false;

    let workspaceDocs = [];
    if (hasDocuments) {
      // For summary queries, we tell the research agent to be more aggressive
      const retrievalResult = await retrieveContext(question, docIdsArray, isSummaryQuery || intent === 'doc_summary');
      context = retrievalResult.context;
      confidence = retrievalResult.confidence;
      alignment = retrievalResult.alignment;
      isReliable = retrievalResult.isReliable;
      chunks = retrievalResult.chunks;
      docNames = retrievalResult.docNames;
      hasMatchedChunks = retrievalResult.hasMatchedChunks;



      // Fetch doc metadata for keyword matching
      try {
        const DocumentModel = (await import('../models/Document.js')).default;
        workspaceDocs = await DocumentModel.find({ _id: { $in: docIdsArray } }).select('name');
      } catch (err) {
        logger.warn('Failed to fetch doc metadata for keyword matching', { err });
      }
    }

    // 5. RAG Mode Logic (Strict vs Hybrid)
    const isStrict = mode === 'strict';
    const isDocQuery = intent === 'doc_question' || intent === 'doc_summary' || isSummaryQuery;

    // In Strict Mode, we block the LLM if context is unreliable for doc queries
    // FIX: If it's a summary query AND we have context (even if not "reliable" by vector score), we allow it.
    if (isStrict && isDocQuery && !isReliable && !isSummaryQuery) {
      const guardrailMsg = "Sorry, I cannot find this information in your document.";
      logger.info('Strict Mode: Rejection triggered (Unreliable context for non-summary query)');
      if (onStream) onStream(guardrailMsg);
      
      return {
        success: true,
        answer: guardrailMsg,
        model: 'system',
        source: 'Strict Guardrail',
        confidence,
        alignment
      };
    }

    if (isStrict && isDocQuery && (!context || context.length < 50) && !hasDocuments) {
      logger.info('Strict Mode: Rejection triggered (No context and no documents)');
       const guardrailMsg = "Sorry, I cannot find this information in your document.";
       if (onStream) onStream(guardrailMsg);
       return { success: true, answer: guardrailMsg, model: 'system', source: 'Strict Guardrail' };
    }

    // 6. Model Resolution & User Identity
    let modelId;
    let userName = 'User';
    let userEmail = '';

    if (userId) {
      const user = await User.findById(userId).select('selectedModel name email');
      if (user) {
        userName = user.name || 'User';
        userEmail = user.email || '';
        if (user.selectedModel && isValidModel(user.selectedModel)) {
          modelId = resolveModel(user.selectedModel);
        }
      }
    }

    if (!modelId) {
      if (intent === 'doc_summary') modelId = config.openrouter.smartModel;
      else if (question.length < 50) modelId = config.openrouter.fastModel;
      else modelId = config.openrouter.chatModel;
    }

    // 7. Generation
    const result = await generateAnswer(question, context, modelId, { 
      onStream, 
      userId,
      userName,
      userEmail,
      isDocFound: intent === 'doc_summary' || isReliable,
      hasDocuments,
      isGreeting: intent === 'greeting',
      history,
      mode: mode, // Pass the resolved mode down
      regenerate: options.regenerate
    });

    // 8. Result Packaging
    let answer = result.success ? result.answer : result.error;
    const isHybridGeneral = result.success && hasDocuments && !isReliable && intent !== 'greeting';
    
    if (isHybridGeneral) {
      answer = `Sorry, but I am not finding anything related in your provided document.\n\n${answer}`;
    }

    // Enhanced source selection: 
    // 1. If question mentions a doc name, prioritize it
    const questionLower = question.toLowerCase();
    const docByKeyword = (workspaceDocs || []).filter(d => {
      const baseName = d.name.split('.')[0].toLowerCase();
      return baseName.length > 2 && questionLower.includes(baseName);
    }).map(d => d.name).join(', ');

    // 2. If vector search failed but question contains unique keywords from doc names (aggressive fallback)
    let docByContentMatch = '';
    if (!docByKeyword && !isReliable && hasDocuments) {
      const keywords = questionLower.split(' ').filter(w => w.length > 3);
      const match = (workspaceDocs || []).find(d => {
        const nameLower = d.name.toLowerCase();
        return keywords.some(k => nameLower.includes(k));
      });
      if (match) docByContentMatch = match.name;
    }

    const responseTime = Date.now() - startTime;
    const finalPayload = {
      success: result.success,
      answer,
      model: result.model,
      confidence,
      alignment,
      source: docByKeyword || docByContentMatch || ((isReliable || hasMatchedChunks) ? (docNames || 'Document') : 'General Knowledge'),
      responseTime,
      cached: false,
      chunks: chunks.slice(0, 3)
    };

    // Ensure source is never empty for the UI
    if (!finalPayload.source) finalPayload.source = 'General Knowledge';

    // 9. Post-Processing
    if (result.success) {
      await trackMetrics(userId, { ...finalPayload, tokens: question.length + (result.answer?.length || 0) });
      
      // Do not cache the LLM response for summaries/meta queries so it responds differently every time
      if (!onStream && intent !== 'doc_summary') {
        await setCachedResponse(cacheKey, finalPayload);
      }
    }

    return finalPayload;

  } catch (error) {
    logger.error('Orchestrator Error', { error: error.message, userId });
    return { success: false, error: 'Internal system error' };
  }
};