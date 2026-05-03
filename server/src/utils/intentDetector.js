/**
 * Intent Detector
 * Classifies user queries using rule-based keyword matching.
 * Returns: 'greeting' | 'doc_summary' | 'doc_question' | 'advice' | 'general'
 */
export const detectIntent = (question) => {
  const q = question.toLowerCase().trim();

  // 1. Greetings, Personal Introductions, Memory & Capabilities
  const greetings = [
    'hi', 'hii', 'hiii', 'hello', 'hey', 'heyy', 'good morning', 'good evening', 
    'how are you', 'whats up', 'namaste', 'greeting', 'my name is', 'i am', "i'm",
    'who are you', 'your name', 'introduce yourself', 'what is yours',
    'what is my name', 'do you know my name', 'tell me my name', 'who am i',
    'last question', 'previous question', 'what did i ask', 'our history', 
    'what was the last thing', 'remember what i said',
    'how can you help', 'what can you do', 'your goal', 'your purpose',
    'help me', 'who can you help', 'can you help', 'how you help',
    'kisme help kar sakti ho', 'kya kar sakte ho', 'kaise madad karoge',
    'kaise ho', 'kise ho', 'kya hal hai', 'kya haal hai'
  ];
  if (greetings.some(g => q.includes(g))) return 'greeting';

  // 1.5 Workspace Info
  const workspaceKeywords = ['about this workspace', 'what is this workspace', 'what workspace is this', 'workspace name', 'current workspace'];
  if (workspaceKeywords.some(k => q.includes(k))) return 'workspace_info';

  // 2. Summary Request
  const summaryKeywords = [
    'summary', 'summarize', 'about this document', 'what is this document', 
    'explain this document', 'overview', 'what is about', 'document about',
    'what is this pdf', 'tell me about', 'describe this', 'docment', 'docoment', 'documnet', 'what is my',
    'topic', 'topics'
  ];
  if (summaryKeywords.some(k => q.includes(k))) return 'doc_summary';

  // 3. Advice / Analysis
  const adviceKeywords = ['advice', 'suggest', 'improve', 'feedback', 'review', 'opinion', 'recommend'];
  if (adviceKeywords.some(k => q.includes(k))) return 'advice';

  // 4. Default to Document Question
  return 'doc_question';
};
