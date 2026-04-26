/**
 * Intent Detector
 * Classifies user queries using rule-based keyword matching.
 * Returns: 'greeting' | 'doc_summary' | 'doc_question' | 'advice' | 'general'
 */
export const detectIntent = (question) => {
  const q = question.toLowerCase().trim();

  // 1. Greetings
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'how are you', 'whats up'];
  if (greetings.some(g => q === g || q.startsWith(g + ' '))) return 'greeting';

  // 2. Summary Request
  const summaryKeywords = ['summary', 'summarize', 'about this document', 'what is this document', 'explain this document', 'overview'];
  if (summaryKeywords.some(k => q.includes(k))) return 'doc_summary';

  // 3. Advice / Analysis
  const adviceKeywords = ['advice', 'suggest', 'improve', 'feedback', 'review', 'opinion', 'recommend'];
  if (adviceKeywords.some(k => q.includes(k))) return 'advice';

  // 4. Default to Document Question
  // In V2, we treat everything else as a question. 
  // The Orchestrator will decide if it's Document-specific or General based on RAG_MODE and confidence.
  return 'doc_question';
};
