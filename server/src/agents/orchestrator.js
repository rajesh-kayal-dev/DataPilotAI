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
 * Orchestrator (Production V6)
 * Uses RAG_MODE to control strict vs hybrid answering behavior.
 */
export const processChatFlow = async (question, documentId, userId, options = {}) => {
  const startTime = Date.now();
  const { onStream } = options;

  try {
    // 1. Rate Limiting & Daily Quota
    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.allowed) return { success: false, error: rateLimit.message };

    // 2. Caching (Production Only)
    const cacheKey = getCacheKey(question, documentId);
    if (!onStream && config.env === 'production') {
      const cached = await getCachedResponse(cacheKey);
      if (cached) return { ...cached, cached: true, responseTime: Date.now() - startTime };
    }

    // 3. Intent Detection
    const intent = detectIntent(question);
    if (intent === 'greeting') {
      return { success: true, answer: "Hello! I'm DataPilot AI. How can I help you today?", model: 'system', source: 'Internal' };
    }

    // 4. Retrieval & Scoring
    const { context, confidence, alignment, isReliable, chunks } = 
      await retrieveContext(question, documentId, intent === 'doc_summary');

    // 5. RAG Mode Logic (Strict vs Hybrid)
    const isStrict = config.rag.mode === 'strict';
    const isDocQuery = intent === 'doc_question' || intent === 'doc_summary';

    // In Strict Mode, we block the LLM if context is unreliable for doc queries
    if (isStrict && isDocQuery && !isReliable) {
      return {
        success: true,
        answer: "I could not find enough matching information in your document to answer this accurately.",
        model: 'system',
        source: 'Strict Guardrail',
        confidence,
        alignment
      };
    }

    // 6. Model Resolution
    let modelId;
    if (userId) {
      const user = await User.findById(userId).select('selectedModel');
      if (user?.selectedModel && isValidModel(user.selectedModel)) {
        modelId = resolveModel(user.selectedModel);
      }
    }

    if (!modelId) {
      if (intent === 'doc_summary') modelId = config.openrouter.smartModel;
      else if (question.length < 50) modelId = config.openrouter.fastModel;
      else modelId = config.openrouter.chatModel;
    }

    // 7. Generation
    const result = await generateAnswer(question, context, modelId, { onStream, userId });

    // 8. Result Packaging
    const responseTime = Date.now() - startTime;
    const finalPayload = {
      success: result.success,
      answer: result.success ? result.answer : result.error,
      model: result.model,
      confidence,
      alignment,
      source: isReliable ? 'Document' : 'General Knowledge',
      responseTime,
      cached: false,
      chunks: chunks.slice(0, 3)
    };

    // 9. Post-Processing
    if (result.success) {
      await trackMetrics(userId, { ...finalPayload, tokens: question.length + (result.answer?.length || 0) });
      if (!onStream) await setCachedResponse(cacheKey, finalPayload);
    }

    return finalPayload;

  } catch (error) {
    logger.error('Orchestrator Error', { error: error.message, userId });
    return { success: false, error: 'Internal system error' };
  }
};