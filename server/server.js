import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8']); // Force Google DNS to resolve SRV records
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { connectRedis } from './src/config/redis.js';
import { ensureCollection } from './src/services/vectorService.js';
import { checkS3Connection } from './src/services/s3Service.js';
import './src/workers/documentWorker.js'; // Start background worker

import { logger } from './src/utils/logger.js';

const PORT = process.env.PORT || 5000;

// Connect to databases
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
