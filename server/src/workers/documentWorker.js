import { Worker } from 'bullmq';
import { processDocument } from '../services/documentService.js';
import { logger } from '../utils/logger.js';
import Redis from 'ioredis';

/**
 * Document Processing Worker
 * Listens to the 'document-processing' queue and handles chunking + embedding.
 * Worker is only started if REDIS_URL is configured.
 */

let worker = null;

function initWorker() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.info('BullMQ worker disabled - no REDIS_URL configured');
    return;
  }

  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  worker = new Worker('document-processing', async (job) => {
    const { documentId, userId } = job.data;
    
    logger.info(`Processing job ${job.id} for document ${documentId}`);

    try {
      logger.info(`Document ${documentId} is processing...`);
      await processDocument(documentId);
      logger.info(`Successfully processed document ${documentId}`);
    } catch (error) {
      logger.error(`Worker failed for document ${documentId}`, { error: error.message });
      throw error;
    }
  }, {
    connection
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed after retries`, { error: err.message });
  });

  logger.info('BullMQ worker initialized');
}

initWorker();

export default worker;
