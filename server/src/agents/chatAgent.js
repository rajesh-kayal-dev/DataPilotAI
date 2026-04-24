import axios from 'axios';
import { config } from '../config/env.js';

export const runChatAgent = async (question, context) => {
  const prompt = `
You are an expert document analyzer. Your task is to answer the QUESTION using ONLY the provided CONTEXT.

STRICT RULES:
1. Answer strictly based on the CONTEXT provided below.
2. If the answer is not contained within the CONTEXT, say exactly: "Answer not found in the document"
3. Do NOT use any external knowledge or general facts.
4. Do NOT mention "According to the document" or similar phrases. Start directly.
5. Use clean markdown formatting.

CONTEXT:
${context || 'NO CONTEXT PROVIDED.'}

QUESTION:
${question}

ANSWER:
`;

  const response = await axios.post(`${config.ollama.baseUrl}/api/generate`, {
    model: config.ollama.chatModel,
    prompt: prompt,
    stream: false,
    options: {
      num_predict: 200,
      temperature: 0.3,
      top_p: 0.9,
      num_ctx: 2048
    }
  });

  return response.data.response;
};