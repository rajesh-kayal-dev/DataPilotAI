import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import documentRoutes from './routes/documentRoutes.js';
import streamRoutes from './routes/streamRoutes.js';
import authRoutes from './routes/authRoutes.js';
import googleRoutes from './routes/googleAuthRoutes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:5173', "https://__.vercel.app"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));


app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());


app.use('/api/documents', documentRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', googleRoutes);

app.get('/', (req, res) => {
  res.send('AI SaaS Backend is running!');
});

export default app;