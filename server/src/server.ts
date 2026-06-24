import 'dotenv/config';
import dns from 'dns';
import { DOMParser } from '@xmldom/xmldom';
(globalThis as any).DOMParser = DOMParser;
import app from './app.js';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import { ensureCollection } from './vectorstore/qdrant.js';
import { checkS3Connection } from './services/s3Service.js';
import { logger } from './utils/logger.js';
import './workers/documentWorker.js'; // Start background worker

if (process.env.NODE_ENV === 'production') {
  dns.setServers(['8.8.8.8']);
}

const PORT = process.env.PORT || 5000;

// Connect to databases and services
await connectDB();
await connectRedis();
await ensureCollection();
await checkS3Connection();

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  if (process.env.RAZORPAY_KEY_ID) {
    logger.info('Razorpay connected successfully');
  }
});
