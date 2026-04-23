import app from './src/app.js';
import 'dotenv/config';
import connectDB from './src/config/db.js';
import { connectRedis } from './src/config/redis.js';
import { Orchestrator } from './src/agents/orchestrator.js';
import { ResearchAgent } from './src/agents/researchAgent.js';
import { ChatAgent } from './src/agents/chatAgent.js';

const PORT = process.env.PORT || 5000;

// Connect to databases
await connectDB();
await connectRedis();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize agents
const orchestrator = new Orchestrator();
orchestrator.registerAgent('research', new ResearchAgent());
orchestrator.registerAgent('chat', new ChatAgent());

export { orchestrator };
