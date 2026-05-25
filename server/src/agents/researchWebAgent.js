import { searchWeb } from '../services/webSearchService.js';
import { logger } from '../utils/logger.js';

/**
 * Research Web Agent
 * Performs live web search via Tavily API and returns structured results.
 */
export const retrieveWebContext = async (question, options = {}) => {
  const {
    maxResults = 5,
    searchDepth = 'basic',
  } = options;

  try {
    const result = await searchWeb(question, {
      maxResults,
      searchDepth,
      includeAnswer: true,
      includeRawContent: false,
    });

    if (!result.success || result.results.length === 0) {
      logger.warn('Web search returned no results', { question });
      return {
        context: '',
        confidence: 0,
        isReliable: false,
        webResults: [],
        hasWebResults: false,
        tavilyAnswer: null,
        error: result.error || 'No web results found',
      };
    }

    const webResults = result.results.map((r, i) => ({
      index: i + 1,
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    }));

    const formattedContext = webResults.map(r =>
      `[WEB SOURCE ${r.index}: ${r.title}](${r.url})\n${r.content}`
    ).join('\n\n---\n\n');

    const context = result.answer
      ? `[TAVILY SUMMARY]\n${result.answer}\n\n[DETAILED WEB RESULTS]\n${formattedContext}`
      : `[WEB SEARCH RESULTS]\n${formattedContext}`;

    const avgScore = webResults.reduce((s, r) => s + r.score, 0) / webResults.length;
    const confidence = Math.min(avgScore, 0.95);

    return {
      context,
      confidence,
      isReliable: confidence > 0.5,
      webResults,
      hasWebResults: true,
      tavilyAnswer: result.answer || null,
    };
  } catch (error) {
    logger.error('Web research agent error', { error: error.message, question });
    return {
      context: '',
      confidence: 0,
      isReliable: false,
      webResults: [],
      hasWebResults: false,
      tavilyAnswer: null,
      error: error.message,
    };
  }
};
