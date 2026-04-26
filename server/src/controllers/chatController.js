import { processChatFlow } from '../agents/orchestrator.js';

/**
 * Chat Controller (Production V2)
 * Handles standard JSON and real-time SSE streaming.
 */
export const handleChat = async (req, res) => {
  const { question, documentId, stream } = req.body;
  const userId = req.user?.id;

  if (!question || !documentId) {
    return res.status(400).json({ error: 'Question and Document ID are required' });
  }

  try {
    // --- Case 1: SSE Streaming ---
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const onStream = (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      };

      const result = await processChatFlow(question, documentId, userId, { onStream });
      res.write(`data: ${JSON.stringify({ done: true, ...result })}\n\n`);
      return res.end();
    }

    // --- Case 2: Standard JSON ---
    const result = await processChatFlow(question, documentId, userId);
    return res.json(result);

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
};
