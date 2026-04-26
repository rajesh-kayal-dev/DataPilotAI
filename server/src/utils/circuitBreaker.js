import { logger } from './logger.js';

/**
 * Simple Production Circuit Breaker
 * Prevents cascading failures when the LLM provider is down.
 */
class CircuitBreaker {
  constructor(name, threshold = 5, resetTimeout = 60000) {
    this.name = name;
    this.threshold = threshold; // Max failures before opening
    this.resetTimeout = resetTimeout; // Time to wait before half-open
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = 0;
  }

  async execute(action, fallback) {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        logger.warn(`Circuit ${this.name} is OPEN. Using fallback.`);
        return fallback();
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      return fallback();
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure(error) {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      logger.error(`Circuit ${this.name} flipped to OPEN`, { failures: this.failures });
    }
  }
}

export const llmCircuitBreaker = new CircuitBreaker('OpenRouter');
