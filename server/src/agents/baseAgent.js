import { logger } from '../utils/logger.js';

export class BaseAgent {
  constructor(name) {
    this.name = name;
  }

  // To be implemented by child agents
  async execute(task) {
    throw new Error(`${this.name}: 'execute' method not implemented.`);
  }

  // Helper: Log agent actions (routes through centralized logger)
  log(message) {
    logger.info(`[${this.name}] ${message}`);
  }
}