import express from 'express';
import { orchestrator } from '../../server.js';

const router = express.Router();

router.get('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const task = { query: req.query.query || 'What is AI?' };

  try {
    // Run the full workflow: research -> chat
    const researchResult = await orchestrator.agents.research.execute(task);
    const responseGenerator = orchestrator.agents.chat.execute(researchResult);

    for await (const chunk of responseGenerator) {
      res.write(`data: ${chunk}\n\n`);
    }
  } catch (error) {
    res.write(`data: [ERROR] ${error.message}\n\n`);
  } finally {
    res.end();
  }
});

export default router;