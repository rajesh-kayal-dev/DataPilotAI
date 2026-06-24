import axios from 'axios';
import { config } from '../config/env.js';
import { buildRAGPrompt, buildStrictRAGPrompt, buildGeneralPrompt, buildHelpPrompt } from '../utils/promptBuilder.js';
import { buildSummaryPrompt } from '../utils/summaryPromptBuilder.js';
import { buildCitationPrompt } from '../utils/citationPromptBuilder.js';
import { logger } from '../utils/logger.js';
import { llmCircuitBreaker } from '../utils/circuitBreaker.js';

class CreditError extends Error {
  constructor(provider) {
    super(`CREDIT_EXHAUSTED:${provider}`);
    this.name = 'CreditError';
    this.provider = provider;
    this.isCreditExhausted = true;
  }
}

const isCreditError = (error) => {
  if (error?.isCreditExhausted) return true;
  const status = error?.response?.status;
  const msg = (error?.message || '').toLowerCase();
  const responseData = error?.response?.data;
  const dataStr = responseData ? JSON.stringify(responseData).toLowerCase() : '';
  const combined = `${msg} ${dataStr}`;

  if (status === 402 || status === 429) return true;

  const keywords = ['credit', 'quota', 'exhausted', 'insufficient', 'rate limit', 'payment required', 'billing', 'over quota'];
  return keywords.some(k => combined.includes(k));
};

const buildChatMessages = (question, context, options = {}) => {
  const {
    isDocFound = true,
    hasDocuments = true,
    isGreeting = false,
    isHelpIntent = false,
    history = [],
    mode = 'hybrid',
    regenerate = false,
    userName = 'a user',
    userEmail = '',
    isSummarizer = false,
    isCitation = false,
    citationSources = [],
  } = options;

  const chatMessages = [];

  chatMessages.push({
    role: 'system',
    content: `You are DataPilot AI, a smart and friendly assistant. Keep responses conversational, concise, and easy to read. Write like a knowledgeable friend — not a textbook. Short paragraphs, direct answers, no fluff. Only use their name if the user directly asks about themselves (their profile is: Name: ${userName}, Email: ${userEmail || 'Not provided'}).${regenerate ? '\n\nThe user wants a DIFFERENT and improved version of the previous answer. Change the structure and approach.' : ''}`
  });

  const historyExchanges = history.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  })).slice(-8);

  chatMessages.push(...historyExchanges);

  const contextLength = context?.length || 0;
  const hasSufficientContext = contextLength > 50;

  let prompt;

  if (isHelpIntent) {
    prompt = buildHelpPrompt(question, isGreeting, hasDocuments);
  } else if (isCitation && hasSufficientContext) {
    prompt = buildCitationPrompt(context, question, citationSources, isGreeting);
  } else if (isSummarizer && hasSufficientContext) {
    prompt = buildSummaryPrompt(context, question, isGreeting);
  } else if (mode === 'strict') {
    prompt = buildStrictRAGPrompt(context, question, isDocFound, hasDocuments, isGreeting);
  } else {
    if (isGreeting) {
      prompt = buildRAGPrompt(context, question, isDocFound, hasDocuments, true);
    } else if (hasDocuments) {
      prompt = buildRAGPrompt(context, question, isDocFound, hasDocuments, false);
    } else {
      prompt = buildGeneralPrompt(question, isGreeting);
    }
  }

  chatMessages.push({
    role: 'user',
    content: prompt
  });

  return chatMessages;
};

const callOpenRouter = async (chatMessages, selectedModel, isFallback, options) => {
  const { onStream } = options;

  try {
    const response = await axios.post(
    `${config.openrouter.baseUrl}/chat/completions`,
    {
      model: selectedModel,
      messages: chatMessages,
      max_tokens: isFallback ? 150 : config.llm.maxTokens,
      temperature: options.regenerate ? 0.8 : config.llm.temperature,
      top_p: config.llm.topP,
      stream: !!onStream,
    },
    {
      headers: {
        Authorization: `Bearer ${config.openrouter.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.server.frontendUrl || 'http://localhost:5173',
        'X-Title': 'DataPilot AI',
      },
      timeout: config.llm.timeout,
      responseType: onStream ? 'stream' : 'json',
    }
  );

    if (onStream) {
      return new Promise((resolve, reject) => {
        let fullText = '';
        let buffer = '';
        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.includes('[DONE]')) break;
            if (!trimmed) continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
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
  } catch (error) {
    if (isCreditError(error)) throw new CreditError('openrouter');
    throw error;
  }
};

const callGroq = async (chatMessages, selectedModel, isFallback, options) => {
  const { onStream } = options;

  try {
    JSON.stringify(chatMessages);
    logger.info('chatMessages is safe for JSON serialization');
  } catch (err) {
    logger.error('chatMessages contains circular references!', { error: err.message, chatMessages });
  }

  try {
    const response = await axios.post(
      `${config.groq.baseUrl}/chat/completions`,
      {
        model: selectedModel,
        messages: chatMessages,
        max_tokens: isFallback ? 150 : config.llm.maxTokens,
        temperature: options.regenerate ? 0.8 : config.llm.temperature,
        top_p: config.llm.topP,
        stream: !!onStream,
      },
      {
        headers: {
          Authorization: `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: config.llm.timeout,
        responseType: onStream ? 'stream' : 'json',
      }
    );

    if (onStream) {
      return new Promise((resolve, reject) => {
        let fullText = '';
        let buffer = '';
        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.includes('[DONE]')) break;
            if (!trimmed) continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
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
  } catch (error) {
    if (isCreditError(error)) throw new CreditError('groq');
    throw error;
  }
};

const callFreemodel = async (chatMessages, selectedModel, isFallback, options) => {
  const { onStream } = options;

  try {
    const anthropicMessages = [];
    for (const msg of chatMessages) {
      if (msg.role === 'system') {
        continue;
      }
      anthropicMessages.push({
        role: msg.role,
        content: msg.content
      });
    }

    const systemPrompt = chatMessages.find(m => m.role === 'system')?.content || '';

    const body = {
      model: selectedModel,
      max_tokens: isFallback ? 150 : config.llm.maxTokens,
      messages: anthropicMessages,
      stream: !!onStream,
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const response = await axios.post(
    `${config.freemodel.baseUrl}/v1/messages`,
    body,
    {
      headers: {
        'x-api-key': config.freemodel.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: config.llm.timeout,
      responseType: onStream ? 'stream' : 'json',
    }
  );

  if (onStream) {
    return new Promise((resolve, reject) => {
      let fullText = '';
      let buffer = '';

      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('event: ')) continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
                fullText += data.delta.text;
                onStream(data.delta.text);
              }
            } catch (e) {}
          }
        }
      });

      response.data.on('end', () => resolve({ success: true, answer: fullText, model: selectedModel }));
      response.data.on('error', reject);
    });
  }

  const contentBlocks = response.data?.content || [];
  const answer = contentBlocks.map(b => b.text || '').join('').trim();
  if (!answer) throw new Error('EMPTY_RESPONSE');
  if (answer.includes('Please use Claude Code CLI')) {
    throw new Error('FreeModel API only works with the Claude Code CLI tool. Direct API access is not available.');
  }
  return { success: true, answer, model: selectedModel };
  } catch (error) {
    if (isCreditError(error)) throw new CreditError('freemodel');
    throw error;
  }
};

const callGemini = async (chatMessages, selectedModel, isFallback, options) => {
  const { onStream } = options;

  try {
    const systemMsg = chatMessages.find(m => m.role === 'system');
    const historyMsgs = chatMessages.filter(m => m.role !== 'system');

    let contents = [];
    let lastRole = null;

    for (const msg of historyMsgs) {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      if (role === lastRole) {
        // Merge consecutive messages of the same role
        contents[contents.length - 1].parts[0].text += '\\n\\n' + msg.content;
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content }]
        });
        lastRole = role;
      }
    }

    // Gemini requires the first message to be from 'user'
    if (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    const body = {
      contents,
      generationConfig: {
        maxOutputTokens: isFallback ? 150 : config.llm.maxTokens,
        temperature: options.regenerate ? 0.8 : config.llm.temperature,
        topP: config.llm.topP,
      }
    };

    if (systemMsg) {
      body.systemInstruction = {
        parts: [{ text: systemMsg.content }]
      };
    }

    const url = onStream
      ? `${config.gemini.baseUrl}/v1beta/models/${selectedModel}:streamGenerateContent?alt=sse`
      : `${config.gemini.baseUrl}/v1beta/models/${selectedModel}:generateContent`;

    const response = await axios.post(url, body, {
    headers: {
      'X-goog-api-key': config.gemini.apiKey,
      'Content-Type': 'application/json',
    },
    timeout: config.llm.timeout,
    responseType: onStream ? 'stream' : 'json',
  });

  if (onStream) {
    return new Promise((resolve, reject) => {
      let fullText = '';
      let buffer = '';

      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // SSE events are separated by double newlines (\n\n or \r\n\r\n)
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || '';

        for (const event of events) {
          if (event.includes('[DONE]')) break;
          
          let jsonStr = '';
          const lines = event.split(/\r?\n/);
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              jsonStr += line.slice(6);
            }
          }
          
          if (!jsonStr) continue;
          
          try {
            const data = JSON.parse(jsonStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullText += text;
              onStream(text);
            }
          } catch (e) {}
        }
      });

      response.data.on('end', () => {
        // Process any remaining buffer that wasn't properly terminated
        if (buffer) {
          let jsonStr = '';
          const lines = buffer.split(/\r?\n/);
          for (const line of lines) {
            if (line.startsWith('data: ')) jsonStr += line.slice(6);
          }
          if (jsonStr && !jsonStr.includes('[DONE]')) {
            try {
              const data = JSON.parse(jsonStr);
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text) {
                fullText += text;
                onStream(text);
              }
            } catch (e) {}
          }
        }
        resolve({ success: true, answer: fullText, model: selectedModel });
      });
      response.data.on('error', reject);
    });
  }

  const answer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!answer) throw new Error('EMPTY_RESPONSE');
  return { success: true, answer, model: selectedModel };
  } catch (error) {
    if (isCreditError(error)) throw new CreditError('gemini');
    throw error;
  }
};

/**
 * Chat Agent (Production V7 - Multi-Provider)
 * Routes to OpenRouter, Freemodel, or Gemini based on apiProvider option.
 */
export const generateAnswer = async (question, context, model, options = {}) => {
  const { onStream, retryCount = 0, isFallback = false, apiProvider = 'groq' } = options;
  const selectedModel = model || 'llama-3.3-70b-versatile';

  if (retryCount > config.llm.retries) {
    logger.error('Max retries exceeded for LLM request', { userId: options.userId, model: selectedModel });
    return { success: false, error: 'AI service temporarily busy', model: selectedModel };
  }

  const apiAction = async () => {
    const chatMessages = buildChatMessages(question, context, options);

    if (apiProvider === 'groq') {
      return await callGroq(chatMessages, selectedModel, isFallback, options);
    }
    if (apiProvider === 'freemodel') {
      return await callFreemodel(chatMessages, selectedModel, isFallback, options);
    }
    if (apiProvider === 'gemini') {
      return await callGemini(chatMessages, selectedModel, isFallback, options);
    }

    return await callOpenRouter(chatMessages, selectedModel, isFallback, options);
  };

  const fallbackHandler = async (err) => {
    const errorMsg = err?.message || 'Circuit Breaker OPEN';
    const errorResponse = err?.response?.data || null;

    if (err?.isCreditExhausted || err?.name === 'CreditError') {
      const provider = err?.provider || 'unknown';
      logger.warn(`Provider ${provider} credits exhausted. Notifying user.`, { model: selectedModel });
      return { success: false, error: `CREDIT_EXHAUSTED:${provider}`, model: selectedModel };
    }

    if (!isFallback) {
      logger.warn('LLM Failure - Using Fallback', { 
        model: selectedModel, 
        apiProvider,
        errorMessage: errorMsg,
        response: errorResponse 
      });
      
      // Use Groq for fallback since OpenRouter/Gemini key might be failing
      const fallbackResult = await generateAnswer(question, context, 'llama-3.3-70b-versatile', { 
        ...options,
        apiProvider: 'groq',
        isFallback: true, 
        retryCount: retryCount + 1 
      });
      return fallbackResult;
    }
    logger.error('Fallback Model Failed', { errorMessage: errorMsg });
    return { success: false, error: 'System busy, please try again.', model: selectedModel };
  };

  if (isFallback || apiProvider !== 'openrouter') {
    try {
      return await apiAction();
    } catch (err) {
      return await fallbackHandler(err);
    }
  }

  return await llmCircuitBreaker.execute(apiAction, fallbackHandler);
};