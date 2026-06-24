/**
 * DataPilotAI — LangSmith Observability Configuration
 *
 * Configures LangSmith tracing so every LangChain / LangGraph call
 * (LLM inference, embedding, retrieval, tool use) is automatically traced
 * and inspectable at https://smith.langchain.com.
 *
 * LangChain reads these env vars automatically — no explicit Client
 * instantiation is needed for background tracing:
 *   LANGCHAIN_TRACING_V2=true
 *   LANGCHAIN_API_KEY=<key>
 *   LANGCHAIN_PROJECT=DataPilotAI
 *   LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
 *
 * Optional manual tracing (Phase 3):
 *   import { Client } from 'langsmith';
 *   const client = new Client({ apiKey: config.langsmith.apiKey });
 */

import { config } from "./env.js";
import { logger } from "../utils/logger.js";

/**
 * Validates LangSmith env vars and sets the LANGCHAIN_* environment variables
 * that LangChain auto-reads for tracing. Call once at server startup.
 */
export function initLangSmith(): void {
  if (!config.langsmith.tracingEnabled) {
    logger.info(
      "LangSmith tracing disabled — set LANGCHAIN_TRACING_V2=true to enable",
    );
    return;
  }

  const { apiKey, project, endpoint } = config.langsmith;

  if (!apiKey) {
    logger.warn("LangSmith tracing enabled but LANGSMITH_API_KEY not set");
    return;
  }

  // Set the env vars that LangChain reads automatically.
  // config.langsmith.project / endpoint always have string defaults so no
  // null-check is needed here beyond the apiKey guard above.
  process.env.LANGCHAIN_TRACING_V2 = "true";
  process.env.LANGCHAIN_API_KEY = apiKey;
  process.env.LANGCHAIN_PROJECT = project;
  process.env.LANGCHAIN_ENDPOINT = endpoint;

  logger.info(
    `LangSmith tracing initialized — project: ${project}, endpoint: ${endpoint}`,
  );
}

/**
 * Returns true only when both LANGCHAIN_TRACING_V2=true AND
 * LANGSMITH_API_KEY is present. Use this guard before calling LangSmith APIs
 * directly (e.g. custom run creation, feedback submission in Phase 3).
 */
export function isTracingEnabled(): boolean {
  return config.langsmith.tracingEnabled && Boolean(config.langsmith.apiKey);
}
