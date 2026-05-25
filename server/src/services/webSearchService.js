import axios from 'axios';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const TAVILY_API_URL = 'https://api.tavily.com/search';

let tavilyAvailable = !!config.tavily.apiKey;

export const searchWeb = async (query, options = {}) => {
  if (!tavilyAvailable) {
    logger.warn('Tavily API key not configured — web search disabled');
    return { success: false, error: 'TAVILY_API_KEY not configured', results: [] };
  }

  const {
    searchDepth = 'basic',
    maxResults = 5,
    includeAnswer = true,
    includeRawContent = false,
  } = options;

  try {
    const response = await axios.post(TAVILY_API_URL, {
      api_key: config.tavily.apiKey,
      query,
      search_depth: searchDepth,
      max_results: maxResults,
      include_answer: includeAnswer,
      include_raw_content: includeRawContent,
    }, {
      timeout: 15000,
    });

    const data = response.data;

    return {
      success: true,
      answer: data.answer || null,
      results: (data.results || []).map(r => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
        rawContent: r.raw_content,
      })),
    };
  } catch (error) {
    logger.error('Tavily search error', { error: error.message, query });
    if (error.response?.status === 401 || error.response?.status === 403) {
      tavilyAvailable = false;
    }
    return { success: false, error: error.message, results: [] };
  }
};

export const getSearchStatus = () => tavilyAvailable;
