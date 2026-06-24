/**
 * DataPilotAI — Qdrant Vector Store (LangChain Interface)
 *
 * Wraps @langchain/qdrant with a thin service layer that:
 *   - Ensures the Qdrant collection and payload index exist at startup.
 *   - Provides typed helpers for per-document filtered search, scroll, and
 *     deletion so the rest of the app never touches the raw Qdrant client.
 *   - Degrades gracefully: if Qdrant is unreachable, all read/write helpers
 *     return empty results instead of throwing, and qdrantAvailable = false.
 *
 * Collection spec:
 *   Name:       QDRANT_COLLECTION env var  (default: "documents")
 *   Dimensions: 768  (must match jina-embeddings-v2-base-en)
 *   Distance:   Cosine
 *   Payload index: "docId" (keyword) — enables O(1) per-document filtering
 */

import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { Document } from "@langchain/core/documents";
import { config } from "../config/env.js";
import { JinaEmbeddings } from "../embeddings/jina.js";
import { logger } from "../utils/logger.js";

// ─────────────────────────────────────────────────────────────────────────────
// Module-level state
// ─────────────────────────────────────────────────────────────────────────────

const VECTOR_SIZE = 768;

let qdrantClient: QdrantClient | null = null;
let qdrantAvailable = false;

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Lazily creates the QdrantClient singleton. */
function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({
      url: config.qdrant.url,
      ...(config.qdrant.apiKey ? { apiKey: config.qdrant.apiKey } : {}),
      // Disable version compatibility check so mismatches don't block startup.
      checkCompatibility: false,
    });
  }
  return qdrantClient;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collection bootstrap
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensure the Qdrant collection and docId payload index exist.
 * Call once at server startup before processing any documents.
 * Sets qdrantAvailable = true on success, false on any failure.
 */
export async function ensureCollection(): Promise<void> {
  try {
    const client = getQdrantClient();

    // Connectivity probe — fail fast and mark unavailable if Qdrant is down.
    let collectionsResult: Awaited<ReturnType<QdrantClient["getCollections"]>>;
    try {
      collectionsResult = await client.getCollections();
    } catch (error: unknown) {
      qdrantAvailable = false;
      logger.error("Failed to connect to Qdrant", { error });
      return;
    }

    logger.info("Qdrant connected successfully");

    const collectionName = config.qdrant.collection;
    const exists = collectionsResult.collections.some(
      (c) => c.name === collectionName,
    );

    if (!exists) {
      await client.createCollection(collectionName, {
        vectors: { size: VECTOR_SIZE, distance: "Cosine" },
      });
      logger.info(`Created Qdrant collection: ${collectionName}`);
    }

    // Idempotent: recreating an index on an already-indexed field is a no-op.
    await client.createPayloadIndex(collectionName, {
      field_name: "docId",
      field_schema: "keyword",
      wait: true,
    });

    qdrantAvailable = true;
  } catch (error: unknown) {
    qdrantAvailable = false;
    logger.error("Qdrant unavailable — RAG features disabled", {
      error,
      url: config.qdrant.url,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LangChain VectorStore accessor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return a QdrantVectorStore bound to the configured collection.
 * Pass a custom JinaEmbeddings instance to override the default (e.g. in tests).
 */
export function getVectorStore(embeddings?: JinaEmbeddings): QdrantVectorStore {
  return new QdrantVectorStore(embeddings ?? new JinaEmbeddings(), {
    client: getQdrantClient(),
    collectionName: config.qdrant.collection,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Retrieval helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Similarity search filtered to a specific set of document IDs.
 * Uses a Qdrant `should` filter (OR semantics) so results may come from any
 * of the provided docIds.
 *
 * @param queryEmbedding  Pre-computed query vector (768 dimensions).
 * @param docIds          Allowlist of document IDs to restrict the search.
 * @param topK            Maximum results to return (default 50).
 */
export async function searchByDocIds(
  queryEmbedding: number[],
  docIds: string[],
  topK = 50,
): Promise<Document[]> {
  if (!qdrantAvailable) return [];
  if (docIds.length === 0) return [];

  try {
    const client = getQdrantClient();

    const results = await client.search(config.qdrant.collection, {
      vector: queryEmbedding,
      limit: topK,
      with_payload: true,
      filter: {
        should: docIds.map((id) => ({ key: "docId", match: { value: id } })),
      },
    });

    return results.map(
      (item) =>
        new Document({
          pageContent: (item.payload?.["content"] as string) ?? "",
          metadata: {
            docId: (item.payload?.["docId"] as string) ?? "",
            chunkIndex: (item.payload?.["chunkIndex"] as number) ?? 0,
            score: item.score,
          },
        }),
    );
  } catch (error: unknown) {
    logger.error("Qdrant searchByDocIds failed", { error });
    return [];
  }
}

/**
 * Retrieve all chunks stored for a single document, ordered by chunk index.
 * Used by the summariser agent which needs the full document context in order.
 */
export async function getAllChunksByDocId(docId: string): Promise<Document[]> {
  if (!qdrantAvailable) return [];

  try {
    const client = getQdrantClient();

    const result = await client.scroll(config.qdrant.collection, {
      filter: {
        must: [{ key: "docId", match: { value: docId } }],
      },
      limit: 200,
      with_payload: true,
      with_vector: false,
    });

    // Sort ascending so the LLM receives chunks in document order.
    const sorted = result.points.slice().sort((a, b) => {
      const indexA = (a.payload?.["chunkIndex"] as number) ?? 0;
      const indexB = (b.payload?.["chunkIndex"] as number) ?? 0;
      return indexA - indexB;
    });

    return sorted.map(
      (item) =>
        new Document({
          pageContent: (item.payload?.["content"] as string) ?? "",
          metadata: {
            docId: (item.payload?.["docId"] as string) ?? "",
            chunkIndex: (item.payload?.["chunkIndex"] as number) ?? 0,
          },
        }),
    );
  } catch (error: unknown) {
    logger.error("Qdrant getAllChunksByDocId failed", { error });
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Delete all vectors associated with a given document ID.
 * Silently ignores 404 / Not Found errors (document may have already been
 * deleted or was never indexed).
 */
export async function deleteByDocId(docId: string): Promise<void> {
  if (!qdrantAvailable) return;

  try {
    const client = getQdrantClient();

    await client.delete(config.qdrant.collection, {
      filter: {
        must: [{ key: "docId", match: { value: docId } }],
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // Treat missing collection / points as a no-op.
    if (message.includes("Not Found") || message.includes("404")) return;
    logger.error("Qdrant deleteByDocId failed", { error });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true after ensureCollection() succeeds. */
export function isQdrantAvailable(): boolean {
  return qdrantAvailable;
}
