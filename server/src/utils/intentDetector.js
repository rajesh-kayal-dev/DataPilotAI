/**
 * Intent Detector
 * Classifies user queries using rule-based keyword matching.
 * Returns: 'greeting' | 'doc_summary' | 'doc_question' | 'advice' | 'general'
 */
export const detectIntent = (question) => {
  const q = question.toLowerCase().trim();

  // 1. Greetings
  const greetings = ['hi', 'hii', 'hiii', 'hello', 'hey', 'heyy', 'good morning', 'good evening', 'how are you', 'whats up'];
  if (greetings.some(g => q === g || q.startsWith(g + ' '))) return 'greeting';

  // 1.5 Workspace Info
  const workspaceKeywords = ['about this workspace', 'what is this workspace', 'what workspace is this', 'workspace name', 'current workspace'];
  if (workspaceKeywords.some(k => q.includes(k))) return 'workspace_info';

  // 2. Summary Request (and Meta Queries)
  const summaryKeywords = [
    'summary', 'summarize', 'about this document', 'what is this document', 
    'explain this document', 'overview', 'what is about', 'document about',
    'what is this pdf', 'tell me about', 'describe this', 'docment', 'docoment', 'documnet', 'what is my',
    'topic', 'topics', 'how can you help', 'what can you do', 'who are you', 'how you can help'
  ];
  if (summaryKeywords.some(k => q.includes(k))) return 'doc_summary';

  // 3. Advice / Analysis
  const adviceKeywords = ['advice', 'suggest', 'improve', 'feedback', 'review', 'opinion', 'recommend'];
  if (adviceKeywords.some(k => q.includes(k))) return 'advice';

  // 4. Default to Document Question
  // In V2, we treat everything else as a question. 
  // The Orchestrator will decide if it's Document-specific or General based on RAG_MODE and confidence.
  return 'doc_question';
};
