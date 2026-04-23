// Mock function to simulate embedding generation
export const generateEmbedding = (text) => {
  // In a real app, use an embedding model (e.g., OpenAI, Hugging Face)
  return Array(1536).fill(0).map(() => Math.random()); // Mock 1536-dim vector
};