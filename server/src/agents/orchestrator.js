import { BaseAgent } from './baseAgent.js';

export class Orchestrator extends BaseAgent {
  constructor() {
    super('Orchestrator');
    this.agents = {};
  }

  registerAgent(name, agent) {
    this.agents[name] = agent;
    this.log(`Registered agent: ${name}`);
  }

  async runWorkflow(workflow, task) {
    this.log(`Starting workflow: ${workflow.join(' -> ')}`);
    let result = task;
    for (const agentName of workflow) {
      const agent = this.agents[agentName];
      if (!agent) throw new Error(`Agent ${agentName} not registered.`);
      result = await agent.execute(result);
    }
    return result;
  }
}