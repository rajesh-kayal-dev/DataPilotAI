import axios from 'axios';
import { config } from '../config/env.js';
import { buildRAGPrompt } from '../utils/promptBuilder.js';
import { logger } from '../utils/logger.js';
import { llmCircuitBreaker } from '../utils/circuitBreaker.js';

/**
 * Chat Agent (Production V6 - Memory Support)
 * Construct a message array including historical context for multi-turn conversations.
 */
export const generateAnswer = async (question, context, model, options = {}) => {
  const { onStream, retryCount = 0, isFallback = false } = options;
  const selectedModel = model || config.openrouter.chatModel;

  if (retryCount > config.llm.retries) {
    logger.error('Max retries exceeded for LLM request', { userId: options.userId, model: selectedModel });
    return { success: false, error: 'AI service temporarily busy', model: selectedModel };
  }

  const apiAction = async () => {
    const { 
      isDocFound = true, 
      hasDocuments = true, 
      isGreeting = false,
      history = [] 
    } = options;

    // 1. Construct Message Array with System Identity
    const chatMessages = [];
    
    // Add Identity: Tell the AI who the user is
    chatMessages.push({
      role: 'system',
      content: `You are DataPilot AI, a professional intelligence assistant. You are chatting with ${options.userName || 'a user'}. Always refer to them by their name if appropriate. If they ask about themselves, you have access to their profile: Name: ${options.userName}, Email: ${options.userEmail || 'Not provided'}.${options.regenerate ? '\n\nIMPORTANT: The user wants an improved and DIFFERENT version of the previous answer. Provide a fresh perspective, refine the depth, and use a slightly different structure to ensure high value.' : ''}`
    });

    // Add History
    const historyExchanges = history.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })).slice(-8);
    
    chatMessages.push(...historyExchanges);

    // 2. Add current question with RAG prompt
    chatMessages.push({
      role: 'user',
      content: buildRAGPrompt(context, question, isDocFound, hasDocuments, isGreeting)
    });

    const response = await axios.post(
      `${config.openrouter.baseUrl}/chat/completions`,
      {
        model: selectedModel,
        messages: chatMessages,
        max_tokens: isFallback ? 150 : config.llm.maxTokens,
        temperature: options.regenerate ? 0.8 : config.llm.temperature,
        stream: !!onStream,
      },
      {
        headers: {
          Authorization: `Bearer ${config.openrouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://datapilot.ai',
          'X-Title': 'DataPilot AI',
        },
        timeout: config.llm.timeout,
        responseType: onStream ? 'stream' : 'json',
      }
    );

    if (onStream) {
      return new Promise((resolve, reject) => {
        let fullText = '';
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(l => l.trim() !== '');
          for (const line of lines) {
            if (line.includes('[DONE]')) break;
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || '';
                fullText += content;
                onStream(content);
              } catch (e) {}
            }
          }
        });
        response.data.on('end', () => resolve({ success: true, answer: fullText, model: selectedModel }));
        response.data.on('error', reject);
      });
    }

    const answer = response.data?.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('EMPTY_RESPONSE');
    return { success: true, answer, model: selectedModel };
  };

  const fallbackHandler = async (err) => {
    const errorMsg = err?.message || 'Circuit Breaker OPEN';
    const errorResponse = err?.response?.data || null;

    if (!isFallback) {
      logger.warn('LLM Failure - Using Fallback', { 
        model: selectedModel, 
        errorMessage: errorMsg,
        response: errorResponse 
      });
      if (options.onStream) {
        options.onStream(`*Note: Your selected model (${selectedModel}) is currently unavailable. I am answering using a recommended backup model (${config.openrouter.fallbackModel}).*\n\n`);
      }
      
      const fallbackResult = await generateAnswer(question, context, config.openrouter.fallbackModel, { 
        ...options,
        isFallback: true, 
        retryCount: retryCount + 1 
      });
      if (fallbackResult.success && !options.onStream) {
        fallbackResult.answer = `*Note: Your selected model (${selectedModel}) is currently unavailable. I am answering using a recommended backup model (${config.openrouter.fallbackModel}).*\n\n${fallbackResult.answer}`;
      }
      return fallbackResult;
    }
    logger.error('Fallback Model Failed', { errorMessage: errorMsg });
    return { success: false, error: 'System busy, please try again.', model: selectedModel };
  };

  return await llmCircuitBreaker.execute(apiAction, fallbackHandler);
};