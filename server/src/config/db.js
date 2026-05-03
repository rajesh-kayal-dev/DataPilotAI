import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * MongoDB Connection with Auto-Reconnect Logic
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error occurred:', { error: err.message });
});

export default connectDB;