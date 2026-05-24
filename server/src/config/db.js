import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * MongoDB Connection with Auto-Reconnect Logic
 */
const connectDB = async () => {
  const isSrv = process.env.MONGODB_URI?.startsWith('mongodb+srv');
  const isLocalDev = process.env.NODE_ENV === 'development';
  
  if (isSrv && isLocalDev) {
    const dns = await import('dns');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      tls: true,
      tlsInsecure: true
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    if (error.message?.includes('IP') || error.message?.includes('whitelist')) {
      logger.warn('Whitelist this machine IP in MongoDB Atlas > Network Access > Add IP Address');
    }
    logger.warn('Server will continue without database - only static routes will work');
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error occurred:', { error: err.message });
});

export default connectDB;