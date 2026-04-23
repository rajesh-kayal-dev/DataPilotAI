import { BaseAgent } from './baseAgent.js';
import { retrieveContext } from '../services/ragService.js';

export class ResearchAgent extends BaseAgent {
  constructor() {
    super('ResearchAgent');
  }

  async execute(task) {
    this.log(`Researching: ${task.query}`);

    // Retrieve context from RAG
    const context = await retrieveContext(task.query);

    // Return the task with research data
    return {
      ...task,
      research: {
        ragContext: context,
        sources: [
          { title: 'RAG Document', content: context },
          { title: 'External Source', url: 'https://example.com/ai' },
        ],
      },
    };
  }
}