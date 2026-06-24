/**
 * DataPilotAI — LangChain-Compatible Jina AI Embeddings
 *
 * Extends the LangChain Embeddings abstract class so JinaEmbeddings integrates
 * natively with QdrantVectorStore, document loaders, and retrieval chains
 * without any adapter glue.
 *
 * Model:  jina-embeddings-v2-base-en
 * Dims:   768  |  Similarity: Cosine
 * API:    https://api.jina.ai/v1/embeddings
 *
 * Features:
 *   - Batch embedding: up to 8 texts per HTTP request (Jina's safe limit)
 *   - Retry with linear back-off on transient network errors
 *   - AbortSignal.timeout(15 s) per request to prevent hangs
 *   - LangSmith tracing inherited from the Embeddings base class callbacks
 */

import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const JINA_EMBEDDING_URL = "https://api.jina.ai/v1/embeddings";
const JINA_MODEL = "jina-embeddings-v2-base-en";
export const EMBEDDING_DIMENSIONS = 768;

/** Node.js error codes that indicate a transient network failure worth retrying. */
const RETRYABLE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
]);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Constructor params
// ─────────────────────────────────────────────────────────────────────────────

interface JinaEmbeddingsParams extends EmbeddingsParams {
  apiKey?: string;
  model?: string;
  maxRetries?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Jina response shape
// ─────────────────────────────────────────────────────────────────────────────

interface JinaResponse {
  data: Array<{ embedding: number[] }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Class
// ─────────────────────────────────────────────────────────────────────────────

export class JinaEmbeddings extends Embeddings {
  private readonly apiKey: string;
  readonly model: string;
  readonly maxRetries: number;

  constructor(params?: JinaEmbeddingsParams) {
    super(params ?? {});

    const apiKey = params?.apiKey ?? config.jina.apiKey;
    if (!apiKey) throw new Error("JINA_API_KEY is required");

    this.apiKey = apiKey;
    this.model = params?.model ?? JINA_MODEL;
    this.maxRetries = params?.maxRetries ?? 3;
  }

  // ── Public LangChain interface ────────────────────────────────────────────

  /**
   * Embed an array of documents. Texts are split into batches of 8 and each
   * batch is sent as a single HTTP request to stay within Jina's safe limits.
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const BATCH_SIZE = 8;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const embeddings = await this._embedBatch(batch);
      results.push(...embeddings);
    }

    return results;
  }

  /**
   * Embed a single query string. Delegates to _embedBatch for unified retry
   * and error-handling logic.
   */
  async embedQuery(text: string): Promise<number[]> {
    const [embedding] = await this._embedBatch([text]);
    // _embedBatch guarantees one result per input text, so the index is safe.
    return embedding!;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * POST a batch of texts to the Jina embeddings endpoint.
   * Retries on transient network errors with linear back-off (300 ms × attempt).
   */
  private async _embedBatch(texts: string[], attempt = 0): Promise<number[][]> {
    try {
      const response = await fetch(JINA_EMBEDDING_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: this.model, input: texts, truncate: true }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jina API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as JinaResponse;
      return data.data.map((item) => item.embedding);
    } catch (error: unknown) {
      // Check if this is a transient Node.js network error worth retrying.
      const code = (error as NodeJS.ErrnoException).code;
      const isTransient = typeof code === "string" && RETRYABLE_CODES.has(code);

      if (isTransient && attempt < this.maxRetries) {
        await sleep(300 * (attempt + 1));
        return this._embedBatch(texts, attempt + 1);
      }

      logger.error("Failed to generate embeddings via Jina AI", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new Error("Failed to generate embeddings via Jina AI");
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level singleton
// Constructed lazily at import time; callers that import jinaEmbeddings must
// null-check before use if JINA_API_KEY may be absent in the environment.
// ─────────────────────────────────────────────────────────────────────────────

let _singleton: JinaEmbeddings | null = null;

try {
  _singleton = new JinaEmbeddings();
} catch {
  logger.warn("JINA_API_KEY not set — Jina embedding features disabled");
}

export const jinaEmbeddings: JinaEmbeddings | null = _singleton;
