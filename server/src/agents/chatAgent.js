import { BaseAgent } from './baseAgent.js';

export class ChatAgent extends BaseAgent {
  constructor() {
    super('ChatAgent');
  }

  async *execute(task) {
    this.log(`Chatting about: ${task.query}`);

    if (!task.research) {
      yield '[ERROR] No research data provided.';
      return;
    }

    yield `Based on your documents and my knowledge:\n`;
    yield `Query: "${task.query}"\n`;
    yield `Context: "${task.research.ragContext.substring(0, 50)}...\n\n`;

    await new Promise(resolve => setTimeout(resolve, 500));

    yield `Here are some relevant sources:\n`;
    for (const source of task.research.sources) {
      yield `- ${source.title}: ${source.content || source.url}\n`;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}