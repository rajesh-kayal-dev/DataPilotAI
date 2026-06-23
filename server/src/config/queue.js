import { Queue } from 'bullmq';
import { redisClient } from './redis.js';
import { logger } from '../utils/logger.js';
import Redis from 'ioredis';

/**
 * Background Job Queues (BullMQ)
 * Offloads document processing (chunking/embedding) to workers.
 * Falls back to synchronous processing if Redis is unavailable.
 */

let documentQueue = null;
let queueReady = false;

function initQueue() {
  const redisUrl = process.env.REDIS_URL;
  // BullMQ requires a TCP Redis connection (Upstash REST API is not compatible)
  if (!redisUrl) {
    logger.info('BullMQ queue disabled - no REDIS_URL (TCP Redis) configured. Documents processed synchronously.');
    return;
  }
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  documentQueue = new Queue('document-processing', {
    connection
  });
  queueReady = true;
  logger.info('BullMQ queue initialized');
}

initQueue();

export const addDocumentJob = async (data) => {
  if (!queueReady) {
    logger.info('Processing document synchronously (queue unavailable)');
    const { processDocument } = await import('../services/documentService.js');
    await processDocument(data.documentId);
    return;
  }
  await documentQueue.add('process-pdf', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  });
};
