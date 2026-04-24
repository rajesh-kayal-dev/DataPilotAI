import express from 'express';
import { processChatFlow } from '../agents/orchestrator.js';

const router = express.Router();

router.get('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const question = req.query.query || 'What is AI?';
  const documentId = req.query.documentId;

  try {
    // Run the full workflow: research -> chat
    const result = await processChatFlow(question, documentId);

    // Send the response
    res.write(`data: ${result.answer}\n\n`);
  } catch (error) {
    res.write(`data: [ERROR] ${error.message}\n\n`);
  } finally {
    res.end();
  }
});

export default router;