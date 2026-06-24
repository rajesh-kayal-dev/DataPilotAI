import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';
import type { DocumentJobData } from '../types/index.js';

/**
 * Background Job Queues (BullMQ) — TypeScript version
 * Replaces queue.js. Offloads document processing (chunking/embedding) to
 * workers. Falls back to synchronous processing when TCP Redis is unavailable.
 *
 * NOTE: BullMQ requires a raw TCP Redis connection. Upstash's REST-only endpoint
 * is NOT compatible — use REDIS_URL (standard ioredis TCP URL) for queuing.
 */

export type DocumentQueue = Queue<DocumentJobData> | null;

let documentQueue: DocumentQueue = null;
let queueReady = false;

function initQueue(): void {
  if (!config.db.redisUrl) {
    logger.info(
      'BullMQ queue disabled - no REDIS_URL (TCP Redis) configured. Documents processed synchronously.'
    );
    return;
  }

  const connection = new Redis(config.db.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  connection.on('error', (error: Error) => {
    logger.error('BullMQ Queue Redis connection error:', { error: error.message });
  });

  connection.on('connect', () => {
    logger.info('BullMQ Redis connection established');
  });

  documentQueue = new Queue<DocumentJobData>('document-processing', { connection });
  queueReady = true;
  logger.info('BullMQ queue initialized');
}

/**
 * Enqueues a document for background processing.
 * Falls back to synchronous processing in the same process when the queue is
 * unavailable (e.g. development without Redis).
 */
export const addDocumentJob = async (data: DocumentJobData): Promise<void> => {
  if (!queueReady || !documentQueue) {
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
    removeOnFail: { count: 10 },
  });
};

// Initialise at module load — runs once when the module is first imported.
initQueue();

export { documentQueue };
