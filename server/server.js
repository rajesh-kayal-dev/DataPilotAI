import app from './src/app.js';
import 'dotenv/config';
import connectDB from './src/config/db.js';
import { connectRedis } from './src/config/redis.js';
import { ensureCollection } from './src/services/vectorService.js';
import './src/workers/documentWorker.js'; // Start background worker

const PORT = process.env.PORT || 5000;

// Connect to databases
await connectDB();
await connectRedis();
await ensureCollection();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
