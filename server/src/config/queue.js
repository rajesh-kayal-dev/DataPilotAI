import { Queue } from 'bullmq';
import { redisClient } from './redis.js';

/**
 * Background Job Queues (BullMQ)
 * Offloads document processing (chunking/embedding) to workers.
 */

export const documentQueue = new Queue('document-processing', {
  connection: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

export const addDocumentJob = async (data) => {
  await documentQueue.add('process-pdf', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  });
};
