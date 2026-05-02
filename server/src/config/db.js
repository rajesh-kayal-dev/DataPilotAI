import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * MongoDB Connection with Auto-Reconnect Logic
 */
const connectDB = async () => {
  const options = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4 // Use IPv4, skip trying IPv6
  };

  try {
    await mongoose.connect(process.env.MONGODB_URI, options);
    logger.info('MongoDB atlas connected successfully');
  } catch (error) {
    logger.error(`Initial MongoDB connection failed: ${error.message}`, { error });
    setTimeout(connectDB, 5000); // Retry after 5s instead of exiting
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error occurred:', { error: err.message });
});

export default connectDB;