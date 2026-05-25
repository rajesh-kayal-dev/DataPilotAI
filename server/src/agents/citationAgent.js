import { generateAnswer } from './chatAgent.js';

/**
 * Citation Agent
 * Generates source-aware answers with clear document references.
 * Uses the existing RAG pipeline for retrieval and chatAgent for generation.
 *
 * Output format: Answer → Sources → Key Takeaway
 */
export const generateCitationAnswer = async (question, context, modelId, options = {}) => {
  const { citationSources = [] } = options;

  const enhancedOptions = {
    ...options,
    isCitation: true,
    citationSources,
  };

  return await generateAnswer(question, context, modelId, enhancedOptions);
};
