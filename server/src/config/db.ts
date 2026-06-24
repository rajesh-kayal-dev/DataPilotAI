import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * MongoDB Connection with Auto-Reconnect Logic — TypeScript version
 * Replaces db.js. The original db.js is retained for Phase 4 cleanup.
 */
const connectDB = async (): Promise<void> => {
  const isSrv = config.db.mongoUri.startsWith('mongodb+srv');

  // On SRV URIs in development, override DNS to avoid corporate/ISP resolver
  // issues that block MongoDB Atlas SRV lookups.
  if (isSrv && config.env === 'development') {
    const dns = await import('dns');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }

  try {
    await mongoose.connect(config.db.mongoUri, {
      serverSelectionTimeoutMS: 10_000,
      tls: true,
      // In production, enforce strict TLS; in development allow self-signed certs.
      tlsInsecure: config.env === 'development',
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    const err = error as Error;
    logger.error('MongoDB connection error:', { error: err.message });
    if (err.message?.includes('IP') || err.message?.includes('whitelist')) {
      logger.warn(
        'Whitelist this machine IP in MongoDB Atlas > Network Access > Add IP Address'
      );
    }
    // Don't exit — static routes (health check, etc.) stay alive.
    logger.warn('Server will continue without database - only static routes will work');
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err: Error) => {
  logger.error('MongoDB error occurred:', { error: err.message });
});

export default connectDB;
