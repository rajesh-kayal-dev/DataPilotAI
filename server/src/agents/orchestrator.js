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

  try {
    // 1. Rate Limiting & Daily Quota
    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.allowed) return { success: false, error: rateLimit.message };

    // 2. Caching (Production Only)
    const cacheKey = getCacheKey(question, docIdsArray.join(','));
    if (!onStream && !options.regenerate && config.env === 'production') {
      const cached = await getCachedResponse(cacheKey);
      if (cached) return { ...cached, cached: true, responseTime: Date.now() - startTime };
    }

    // 3. Intent Detection
    const intent = detectIntent(question);
    
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
    const hasDocuments = docIdsArray.length > 0;

    let workspaceDocs = [];
    if (hasDocuments) {
      const retrievalResult = await retrieveContext(question, docIdsArray, intent === 'doc_summary');
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
    const mode = options.mode || config.rag.mode || 'hybrid';
    console.log("RAG Mode (Orchestrator):", mode);
    
    const isStrict = mode === 'strict';
    const isDocQuery = intent === 'doc_question' || intent === 'doc_summary';

    // In Strict Mode, we block the LLM if context is unreliable for doc queries
    if (isStrict && isDocQuery && !isReliable) {
      const guardrailMsg = "Sorry, I cannot find this information in your document.";
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