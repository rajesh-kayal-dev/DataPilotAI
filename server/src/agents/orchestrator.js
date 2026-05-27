import { retrieveContext } from './researchAgent.js';
import { retrieveWebContext } from './researchWebAgent.js';
import { generateAnswer } from './chatAgent.js';
import { generateSummary } from './summarizerAgent.js';
import { generateCitationAnswer } from './citationAgent.js';
import { config } from '../config/env.js';
import { detectIntent } from '../utils/intentDetector.js';
import { checkRateLimit } from '../utils/rateLimiter.js';
import { getCacheKey, getCachedResponse, setCachedResponse } from '../utils/cache.js';
import { trackMetrics } from '../utils/analytics.js';
import { logger } from '../utils/logger.js';
import { isValidModel, resolveModel, getModelApiProvider, DEFAULT_MODEL_ID } from '../config/modelRegistry.js';
import User from '../models/User.js';

/**
 * Orchestrator (Production V7 - With Memory)
 * Uses RAG_MODE to control strict vs hybrid answering behavior.
 */
export const processChatFlow = async (question, documentIds, userId, options = {}) => {
  const startTime = Date.now();
  const { onStream, onStatus, workspaceId, history = [], selectedAgent = 'chat', webSearch = false } = options;
  const isResearchAgent = selectedAgent === 'research' || webSearch === true;
  const isSummarizerAgent = selectedAgent === 'summarizer';
  const isCitationAgent = selectedAgent === 'citation';

  // Ensure documentIds is an array
  const docIdsArray = Array.isArray(documentIds) ? documentIds : (documentIds ? [documentIds] : []);
  const hasDocuments = docIdsArray.length > 0;

  try {
    // 1. Resolve Mode early for logging and logic
    const mode = options.mode || config.rag.mode || 'hybrid';
    const effectiveMode = isResearchAgent ? 'hybrid' : mode;

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
    const isSummaryQuery = /summarize|summary|overview|key points|explain document/i.test(question) || isSummarizerAgent;
    const isHelpIntent = intent === 'help_intent';

    // 4.5 Document-Check Guardrail (Requested Feature)
    // If user asks for summary/doc analysis but has NOT uploaded any documents
    const isDocRelatedQuery = intent === 'doc_summary' || isSummaryQuery || isCitationAgent;
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
    let citationSources = [];

    let workspaceDocs = [];
    if (hasDocuments) {
      if (isSummarizerAgent && onStatus) onStatus('Reading document...');
      if (isCitationAgent && onStatus) onStatus('Verifying sources...');
      const includeChunkMeta = isCitationAgent;
      const retrievalResult = await retrieveContext(question, docIdsArray, isSummaryQuery || intent === 'doc_summary', includeChunkMeta);
      context = retrievalResult.context;
      confidence = retrievalResult.confidence;
      alignment = retrievalResult.alignment;
      isReliable = retrievalResult.isReliable;
      chunks = retrievalResult.chunks;
      docNames = retrievalResult.docNames;
      hasMatchedChunks = retrievalResult.hasMatchedChunks;
      citationSources = retrievalResult.chunkMeta || [];



      // Fetch doc metadata for keyword matching
      try {
        const DocumentModel = (await import('../models/Document.js')).default;
        workspaceDocs = await DocumentModel.find({ _id: { $in: docIdsArray } }).select('name');
      } catch (err) {
        logger.warn('Failed to fetch doc metadata for keyword matching', { err });
      }
    }

    // 4.5 Web Search (for research agent mode)
    let webResults = [];
    let webContext = '';
    let hasWebResults = false;

    if (isResearchAgent) {
      if (onStatus) onStatus('Searching web and retrieving sources...');
      const webResult = await retrieveWebContext(question, { maxResults: 5 });
      if (webResult.hasWebResults) {
        if (onStatus) onStatus('Analyzing search results...');
        webContext = webResult.context;
        webResults = webResult.webResults || [];
        hasWebResults = true;
        // Merge web context AFTER document context (priority: document → web)
        if (context && webContext) {
          if (onStatus) onStatus('Combining web results with document context...');
          context = context + '\n\n=== WEB SEARCH RESULTS ===\n\n' + webContext;
        } else if (webContext) {
          context = webContext;
        }
        // Boost confidence if web results are reliable
        if (webResult.isReliable && !isReliable) {
          confidence = webResult.confidence;
          isReliable = true;
        }
      }
    }

    // 5. RAG Mode Logic (Strict vs Hybrid)
    const isStrict = effectiveMode === 'strict';
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
    let userSelectedModelId = null;
    let apiProvider = 'openrouter';
    let userName = 'User';
    let userEmail = '';

    if (userId) {
      const user = await User.findById(userId).select('selectedModel name email');
      if (user) {
        userName = user.name || 'User';
        userEmail = user.email || '';
        if (user.selectedModel && isValidModel(user.selectedModel)) {
          userSelectedModelId = user.selectedModel;
          modelId = resolveModel(user.selectedModel);
          apiProvider = getModelApiProvider(user.selectedModel);
        }
      }
    }

    if (!modelId) {
      modelId = resolveModel(DEFAULT_MODEL_ID);
      apiProvider = getModelApiProvider(DEFAULT_MODEL_ID);
    }

    // 7. Generation
    if (isSummarizerAgent && onStatus) onStatus('Creating summary...');
    if (isCitationAgent && onStatus) onStatus('Checking document context...');

    let generateFn;
    if (isCitationAgent) {
      generateFn = (q, ctx, mId, opts) => generateCitationAnswer(q, ctx, mId, { ...opts, citationSources });
    } else if (isSummarizerAgent) {
      generateFn = generateSummary;
    } else {
      generateFn = generateAnswer;
    }

    const result = await generateFn(question, context, modelId, {
      onStream,
      userId,
      userName,
      userEmail,
      apiProvider,
      isDocFound: intent === 'doc_summary' || isReliable,
      hasDocuments,
      isGreeting: intent === 'greeting',
      isHelpIntent,
      history,
      mode: effectiveMode,
      regenerate: options.regenerate
    });

    // 8. Result Packaging
    let answer = result.success ? (result.answer || '').trim() : result.error;
    if (answer) {
      answer = answer.replace(/^Understood,\s*strict\s*mode[.,!]?\s*/i, '');
      answer = answer.replace(/^Strict\s*mode[.,!]?\s*/i, '');
      answer = answer.replace(/^As an? strict\s*mode\s+assistant[.,!]?\s*/i, '');
      // Strip HTML tags that leak from LLM output
      answer = answer.replace(/<br\s*\/?>/gi, '\n');
      answer = answer.replace(/<[^>]+>/g, '');
      // Strip markdown table pipes — tables render as broken text
      answer = answer.replace(/^\|.+/gm, '');
    }
    // Guardrail: empty answer from LLM — provide fallback
    if (!answer && result.success) {
      logger.warn('Empty LLM response, using fallback', { userId, model: modelId, intent, hasDocuments });
      if (hasDocuments) {
        answer = "I could not find a clear answer in the uploaded document. Please try rephrasing your question or check if the document contains the relevant information.";
      } else {
        answer = "I'm not sure about that. Could you please provide more details or upload a document so I can help better?";
      }
    }
    const isHybridGeneral = result.success && hasDocuments && !isReliable && intent !== 'greeting' && !isSummarizerAgent && !isCitationAgent;
    
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

    const combinedSource = docByKeyword || docByContentMatch || ((isReliable || hasMatchedChunks) ? (docNames || 'Document') : '');
    let source = combinedSource;
    if (isSummarizerAgent) {
      source = source ? `Summary of ${source}` : 'Document Summary';
    } else if (isCitationAgent) {
      source = source ? `Sources: ${source}` : 'Document Sources';
    } else if (!source && hasWebResults) {
      source = 'Web Search';
    } else if (!source) {
      source = 'General Knowledge';
    } else if (hasWebResults) {
      source = source + ' + Web';
    }

    const responseTime = Date.now() - startTime;
    const finalPayload = {
      success: result.success,
      answer,
      model: result.model,
      confidence,
      alignment,
      source,
      responseTime,
      cached: false,
      chunks: chunks.slice(0, 3),
      webResults: hasWebResults ? webResults.map(r => ({
        title: r.title,
        url: r.url,
        content: r.content && r.content.length > 200 ? r.content.substring(0, 200) + '...' : r.content,
      })) : undefined,
    };

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