export class BaseAgent {
  constructor(name) {
    this.name = name;
  }

  // To be implemented by child agents
  async execute(task) {
    throw new Error(`${this.name}: 'execute' method not implemented.`);
  }

  // Helper: Log agent actions
  log(message) {
    console.log(`[${this.name}] ${message}`);
  }
}