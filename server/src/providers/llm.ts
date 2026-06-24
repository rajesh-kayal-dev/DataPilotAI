/**
 * DataPilotAI — LangChain LLM Provider Factory
 *
 * Replaces the 4 hand-rolled axios LLM callers (callGroq, callOpenRouter,
 * callGemini, callFreemodel) with a single factory backed by official
 * LangChain provider packages.
 *
 * Architecture Rule:
 *   Groq is PRIMARY. If a model's provider API key is missing → graceful
 *   fallback to Groq llama-3.3-70b-versatile (or llama-3.1-8b-instant for
 *   getFallbackLLM).
 *
 * LangSmith tracing is automatically applied via LANGCHAIN_TRACING_V2 +
 * LANGCHAIN_API_KEY environment variables — no explicit wiring needed here.
 */

import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { config } from "../config/env.js";
import {
  resolveModel,
  getModelApiProvider,
  DEFAULT_MODEL_ID,
} from "../config/modelRegistry.js";
import type { LLMProvider } from "../types/index.js";
import { logger } from "../utils/logger.js";

// ─────────────────────────────────────────────────────────────────────────────
// Public Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LLMOptions {
  /** Enable streaming mode (call .stream() on the returned model). */
  streaming?: boolean;
  /** Sampling temperature override. Ignored when regenerate is true. */
  temperature?: number;
  /** Max output tokens override. Capped at 150 when isFallback is true. */
  maxTokens?: number;
  /** Nucleus sampling — passed through to the interface but not all providers support it. */
  topP?: number;
  /** Bump temperature to 0.8 for creative regeneration. */
  regenerate?: boolean;
  /** Limit output tokens to 150 for lightweight fallback responses. */
  isFallback?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Private Factory Functions
// ─────────────────────────────────────────────────────────────────────────────

function createGroqLLM(
  model: string,
  temperature: number,
  maxTokens: number,
  streaming: boolean,
): ChatGroq {
  const apiKey = config.groq.apiKey;
  if (!apiKey) throw new Error("GROQ_API_KEY is required");

  return new ChatGroq({
    apiKey,
    model,
    temperature,
    maxTokens,
    streaming,
    maxRetries: config.llm.retries,
  });
}

function createOpenRouterLLM(
  model: string,
  temperature: number,
  maxTokens: number,
  streaming: boolean,
): BaseChatModel {
  const apiKey = config.openrouter.apiKey;
  if (!apiKey) {
    logger.warn("OPENROUTER_API_KEY not set, using Groq fallback");
    return createGroqLLM(
      "llama-3.3-70b-versatile",
      temperature,
      maxTokens,
      streaming,
    );
  }

  return new ChatOpenAI({
    apiKey,
    model,
    temperature,
    maxTokens,
    streaming,
    maxRetries: config.llm.retries,
    configuration: {
      baseURL: config.openrouter.baseUrl,
      defaultHeaders: {
        "HTTP-Referer": config.server.frontendUrl,
        "X-Title": "DataPilotAI",
      },
    },
  });
}

function createGeminiLLM(
  model: string,
  temperature: number,
  maxTokens: number,
  streaming: boolean,
): BaseChatModel {
  const apiKey = config.gemini.apiKey;
  if (!apiKey) {
    logger.warn("GEMINI_API_KEY not set, using Groq fallback");
    return createGroqLLM(
      "llama-3.3-70b-versatile",
      temperature,
      maxTokens,
      streaming,
    ) as unknown as BaseChatModel;
  }

  return new ChatGoogleGenerativeAI({
    apiKey,
    model,
    temperature,
    maxOutputTokens: maxTokens,
    streaming,
    maxRetries: config.llm.retries,
  });
}

function createFreemodelLLM(
  model: string,
  temperature: number,
  maxTokens: number,
  streaming: boolean,
): BaseChatModel {
  const apiKey = config.freemodel.apiKey;
  if (!apiKey) {
    logger.warn("FREEMODEL_API_KEY not set, using Groq fallback");
    return createGroqLLM(
      "llama-3.3-70b-versatile",
      temperature,
      maxTokens,
      streaming,
    ) as unknown as BaseChatModel;
  }

  return new ChatAnthropic({
    apiKey,
    model,
    temperature,
    maxTokens,
    streaming,
    maxRetries: config.llm.retries,
    clientOptions: {
      baseURL: `${config.freemodel.baseUrl}/v1`,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a LangChain chat model for the given model ID.
 *
 * Provider resolution order:
 *   1. Look up apiProvider from the model registry.
 *   2. Instantiate the matching LangChain provider class.
 *   3. If the provider's API key is missing → Groq fallback.
 *   4. If the provider is unrecognised → warn + Groq fallback.
 */
export function createLLM(
  modelId: string,
  options?: LLMOptions,
): BaseChatModel {
  const apiProvider = getModelApiProvider(modelId) as LLMProvider;
  // resolveModel returns undefined for unknown IDs; default to the primary Groq model.
  const model = resolveModel(modelId) ?? "llama-3.3-70b-versatile";

  const temperature = options?.regenerate
    ? 0.8
    : (options?.temperature ?? config.llm.temperature);

  const maxTokens = options?.isFallback
    ? 150
    : (options?.maxTokens ?? config.llm.maxTokens);

  const streaming = options?.streaming ?? false;

  switch (apiProvider) {
    case "groq":
      return createGroqLLM(model, temperature, maxTokens, streaming);

    case "openrouter":
      return createOpenRouterLLM(model, temperature, maxTokens, streaming);

    case "gemini":
      return createGeminiLLM(model, temperature, maxTokens, streaming);

    case "freemodel":
      return createFreemodelLLM(model, temperature, maxTokens, streaming);

    default: {
      logger.warn(
        `Unknown API provider '${apiProvider as string}' for model '${modelId}' — falling back to Groq`,
      );
      return createGroqLLM(
        "llama-3.3-70b-versatile",
        temperature,
        maxTokens,
        streaming,
      );
    }
  }
}

/**
 * Return a lightweight Groq model for use as a last-resort fallback.
 * Always uses llama-3.1-8b-instant regardless of the modelId in use.
 */
export function getFallbackLLM(options?: LLMOptions): BaseChatModel {
  const temperature = options?.temperature ?? config.llm.temperature;
  const maxTokens = options?.maxTokens ?? config.llm.maxTokens;
  const streaming = options?.streaming ?? false;

  return createGroqLLM(
    "llama-3.1-8b-instant",
    temperature,
    maxTokens,
    streaming,
  );
}

// Convenience alias — used by streaming paths that want to signal intent.
export const getStreamingLLM = (modelId: string): BaseChatModel =>
  createLLM(modelId, { streaming: true });
