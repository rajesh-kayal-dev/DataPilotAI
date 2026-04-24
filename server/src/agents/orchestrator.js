import { runResearchAgent } from './researchAgent.js';
import { runChatAgent } from './chatAgent.js';
import { redisClient } from '../config/redis.js';

export const processChatFlow = async (question, documentId) => {
  const cacheKey = `chat:${documentId}:${question}`;

  try {
    const cachedResponse = await redisClient.get(cacheKey);
    if (cachedResponse) {
      console.log('Returning cached response');
      return JSON.parse(cachedResponse);
    }
  } catch (error) {
    console.error('Redis Cache Error:', error);
  }

  const { context, topChunks } = await runResearchAgent(question, documentId);

  if (!context || topChunks.length === 0) {
    return {
      answer: 'Sorry, I could not find relevant information in your document.',
      source: undefined
    };
  }

  const answer = await runChatAgent(question, context);
  const source = `Doc ID: ${topChunks[0].docId || 'Unknown'} • Match Score: ${topChunks[0].score}`;
  const result = { answer, source };

  try {
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
  } catch (error) {
    console.error('Redis Cache Set Error:', error);
  }

  return result;
};