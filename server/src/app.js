import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/healthRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import modelRoutes from './routes/modelRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import googleAuthRoutes from './routes/googleAuthRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { logger } from './utils/logger.js';

const app = express();

/**
 * Production Security & Monitoring
 */
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));
const allowedOrigins = [
  'http://localhost:5173',
  'https://datapilotai-delta.vercel.app',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [])
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

/**
 * API Versioning (v1)
 */
const API_V1 = '/api/v1';

app.use('/api', healthRoutes);
app.use(`${API_V1}/auth`, authRoutes);
app.use(`${API_V1}/documents`, documentRoutes);
app.use(`${API_V1}/workspaces`, workspaceRoutes);
app.use(`${API_V1}/chat`, chatRoutes);
app.use(`${API_V1}/models`, modelRoutes);
app.use(`${API_V1}/feedback`, feedbackRoutes);
app.use(`${API_V1}/admin`, adminRoutes);
app.use(`${API_V1}`, googleAuthRoutes);
app.use(`${API_V1}/payments`, paymentRoutes);

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  logger.error('API Error', { error: err.message, path: req.path });
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Our engineers are notified.' 
      : err.message
  });
});

export default app;