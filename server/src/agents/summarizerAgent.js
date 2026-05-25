import { generateAnswer } from './chatAgent.js';

/**
 * Summarizer Agent
 * Takes document context and generates structured summaries
 * with Short Summary, Key Points, Details, and Key Takeaway sections.
 *
 * Reuses generateAnswer from chatAgent but with summarization-specific prompt.
 */
export const generateSummary = async (question, context, modelId, options = {}) => {
  const enhancedOptions = {
    ...options,
    isSummarizer: true,
  };

  return await generateAnswer(question, context, modelId, enhancedOptions);
};
