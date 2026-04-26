import axios from 'axios';
import { config } from '../config/env.js';
import { buildRAGPrompt } from '../utils/promptBuilder.js';
import { logger } from '../utils/logger.js';
import { llmCircuitBreaker } from '../utils/circuitBreaker.js';

/**
 * Chat Agent (Production V5)
 * Zero hardcoded values. Full control via config suite.
 */
export const generateAnswer = async (question, context, model, options = {}) => {
  const { onStream, retryCount = 0, isFallback = false } = options;
  const selectedModel = model || config.openrouter.chatModel;

  // 1. Cost Protection: Stop if max retries exceeded
  if (retryCount > config.llm.retries) {
    logger.error('Max retries exceeded for LLM request', { userId: options.userId, model: selectedModel });
    return { success: false, error: 'AI service temporarily busy', model: selectedModel };
  }

  const apiAction = async () => {
    const response = await axios.post(
      `${config.openrouter.baseUrl}/chat/completions`,
      {
        model: selectedModel,
        messages: [{ role: 'user', content: buildRAGPrompt(context, question) }],
        max_tokens: isFallback ? 150 : config.llm.maxTokens,
        temperature: config.llm.temperature,
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

    // Stream handler
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

  const fallbackHandler = async () => {
    if (!isFallback) {
      logger.warn('LLM Failure - Using Fallback', { model: selectedModel });
      return await generateAnswer(question, context, config.openrouter.fallbackModel, { 
        isFallback: true, 
        retryCount: retryCount + 1 
      });
    }
    return { success: false, error: 'System busy, please try again.', model: selectedModel };
  };

  return await llmCircuitBreaker.execute(apiAction, fallbackHandler);
};