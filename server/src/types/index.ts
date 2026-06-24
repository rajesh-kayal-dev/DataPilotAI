/**
 * DataPilotAI — Shared TypeScript Types & Interfaces
 *
 * Single source of truth for all shared types used across config, models,
 * services, controllers, graphs, and utilities.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Naming conventions:
 *   I<Name>      → Mongoose document interface  (e.g. IUser, IDocument)
 *   <Name>Dto    → Data transfer object         (e.g. ChatResponseDto)
 *   <Name>State  → LangGraph state              (e.g. ChatGraphState)
 *   <Name>Config → Configuration shape          (e.g. LLMConfig)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Document as LangChainDocument } from "@langchain/core/documents";
import type { Types } from "mongoose";

// ---------------------------------------------------------------------------
// Type Aliases
// ---------------------------------------------------------------------------

export type DocumentStatus = "pending" | "processing" | "completed" | "failed";
export type RagMode = "hybrid" | "strict";
export type AgentType = "chat" | "research" | "summarizer" | "citation";
export type LLMProvider = "groq" | "openrouter" | "gemini" | "freemodel";
export type UserPlan = "free" | "pro";

/** Model capability tier — used for UI grouping and fallback ordering. */
export type ModelTier =
  | "top"
  | "fast"
  | "specialized"
  | "premium"
  | "budget"
  | "balanced";

// ---------------------------------------------------------------------------
// Mongoose Document Interfaces
// Phase 2: ObjectId fields use Types.ObjectId; timestamps fields omitted
//          (Mongoose injects them via { timestamps: true } or manual default).
// ---------------------------------------------------------------------------

export interface IUser {
  name: string;
  email: string;
  /** Absent for Google OAuth accounts. */
  password?: string;
  googleId?: string;
  authProvider: "local" | "google";
  isVerified: boolean;
  plan: "free" | "pro";
  planId: "free" | "pro_monthly" | "pro_6month";
  subscriptionExpiry?: Date;
  /** Stacked / queued upgrade — null when none is pending. */
  queuedPlanId: "pro_monthly" | "pro_6month" | null;
  selectedModel: string;
  ragMode: RagMode;
  // createdAt / updatedAt injected by Mongoose { timestamps: true }
}

export interface IDocument {
  name: string;
  type: "pdf" | "txt" | "docx" | "other";
  size: number;
  filePath: string;
  s3Key: string;
  userId: Types.ObjectId;
  status: DocumentStatus;
  retryCount: number;
  lastError?: string;
  workspaceId: Types.ObjectId;
  // createdAt / updatedAt injected by Mongoose { timestamps: true }
}

/** Embedded sub-document inside IChat.messages. */
export interface IMessage {
  role: "user" | "assistant";
  content: string;
  source?: string;
  modelName?: string;
  confidence?: number;
  createdAt: Date;
}

export interface IChat {
  title: string;
  workspaceId: Types.ObjectId;
  user?: Types.ObjectId;
  activeDocumentId?: Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
}

export interface IWorkspace {
  name: string;
  user: Types.ObjectId;
  createdAt: Date;
}

export interface IFeedback {
  user: Types.ObjectId;
  userName: string;
  /** Integer 1–5 inclusive. */
  rating: number;
  type: "issue" | "recommendation" | "other";
  comment: string;
  createdAt: Date;
}

export interface ITransaction {
  userId: Types.ObjectId;
  planId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status: "pending" | "captured" | "failed";
  metadata?: Map<string, string>;
  // createdAt / updatedAt injected by Mongoose { timestamps: true }
}

// ---------------------------------------------------------------------------
// Model Registry Types
// ---------------------------------------------------------------------------

/**
 * A single entry in the MODEL_REGISTRY.
 * `configured` is a static hint in the registry; `getGroupedModels()` overrides
 * it dynamically based on whether the provider's API key is present at runtime.
 */
export interface ModelEntry {
  /** Stable identifier used throughout the codebase (e.g. 'groq-llama-70b'). */
  id: string;
  /** Human-readable display name shown in the UI. */
  label: string;
  /** Organisation/lab that trained the model (e.g. 'Groq', 'OpenAI'). */
  provider: string;
  /** Provider-specific model string sent in API calls. */
  model: string;
  /** Billing class — free models have no per-token cost. */
  type: "free" | "paid";
  /** Capability tier used for sorting and fallback decisions. */
  tier: ModelTier;
  /** Short badge label rendered in the model picker (e.g. 'Fast', 'Best'). */
  badge: string;
  /** Which API backend routes requests for this model. */
  apiProvider: LLMProvider;
  /**
   * Static configured hint. Overridden at runtime by `getGroupedModels()` which
   * checks whether the provider's API key is actually present in the environment.
   */
  configured: boolean;
  /** ID of the model to fall back to when this model is unavailable. */
  fallbackId: string;
}

/** Shape returned by `getGroupedModels()` — models enriched with runtime `configured` flag. */
export interface GroupedModels {
  free: ModelEntry[];
  paid: ModelEntry[];
}

// ---------------------------------------------------------------------------
// Chat & Retrieval DTOs
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: string;
  modelName?: string;
  confidence?: number;
}

export interface WebResult {
  index: number;
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface ChatResponseDto {
  success: boolean;
  answer: string;
  model?: string;
  confidence?: number;
  alignment?: number;
  source?: string;
  responseTime?: number;
  cached?: boolean;
  chunks?: number;
  webResults?: WebResult[];
  error?: string;
}

export interface ChunkMeta {
  docName: string;
  score: number;
  chunkIndex: number;
  content: string;
}

export interface RetrievalResult {
  context: string;
  confidence: number;
  alignment: number;
  isReliable: boolean;
  docNames: string[];
  hasMatchedChunks: boolean;
  chunks: number;
  chunkMeta: ChunkMeta[];
}

export interface RankedChunk {
  score: number;
  content: string;
  docId: string;
  chunkIndex: number;
  alignmentScore: number;
  rerankScore: number;
}

// ---------------------------------------------------------------------------
// LangGraph State Types
// ---------------------------------------------------------------------------

export interface DocumentGraphState {
  documentId: string;
  s3Key: string;
  workspaceId: string;
  userId: string;
  documentType: string;
  extractedText: string;
  chunks: LangChainDocument[];
  status: DocumentStatus;
  error?: string;
}

export interface ChatGraphState {
  question: string;
  workspaceId: string;
  userId: string;
  chatId?: string;
  activeDocIds: string[];
  selectedAgent: AgentType;
  ragMode: RagMode;
  webSearch: boolean;
  regenerate: boolean;
  history: ChatMessage[];
  intent: string;
  retrievedChunks: RankedChunk[];
  webResults: WebResult[];
  context: string;
  confidence: number;
  alignment: number;
  isReliable: boolean;
  modelId: string;
  apiProvider: LLMProvider;
  userName: string;
  userEmail: string;
  answer: string;
  source: string;
  cachedResponse?: ChatResponseDto;
  onStream?: (chunk: string) => void;
  onStatus?: (msg: string) => void;
}

// ---------------------------------------------------------------------------
// Auth Types
// ---------------------------------------------------------------------------

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

// ---------------------------------------------------------------------------
// Express Request Augmentation
// ---------------------------------------------------------------------------

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ---------------------------------------------------------------------------
// Background Job Types
// ---------------------------------------------------------------------------

/** Payload passed to BullMQ when enqueuing a document processing job. */
export interface DocumentJobData {
  /** MongoDB ObjectId of the Document to process. */
  documentId: string;
  /** Owner user ID — used for quota tracking. */
  userId: string;
  /** S3 key of the uploaded file — used by the worker to fetch the file. */
  s3Key?: string;
}

export interface MetricsData {
  model?: string;
  success?: boolean;
  tokens?: number;
}

// ---------------------------------------------------------------------------
// Shared Utility
// ---------------------------------------------------------------------------

/** Generic API success/error wrapper returned by all controllers. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
