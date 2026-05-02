import { Worker } from 'bullmq';
import { processDocument } from '../services/documentService.js';
import { logger } from '../utils/logger.js';

/**
 * Document Processing Worker
 * Listens to the 'document-processing' queue and handles chunking + embedding.
 */

const worker = new Worker('document-processing', async (job) => {
  const { documentId, userId } = job.data;
  
  logger.info(`Processing job ${job.id} for document ${documentId}`);

  try {
    logger.info(`Document ${documentId} is processing...`);
    await processDocument(documentId);
    logger.info(`Successfully processed document ${documentId}`);
  } catch (error) {
    logger.error(`Worker failed for document ${documentId}`, { error: error.message });
    throw error; // Let BullMQ handle the retry
  }
}, {
  connection: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed after retries`, { error: err.message });
});

export default worker;
