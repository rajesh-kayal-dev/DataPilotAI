import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import type { IDocument } from '../types/index.js';

// ── Document type ─────────────────────────────────────────────────────────────

/** Hydrated Mongoose document for IDocument. Named DocumentDoc to avoid
 *  redundancy with the Mongoose base Document type. */
export type DocumentDoc = HydratedDocument<IDocument>;

// ── Schema ────────────────────────────────────────────────────────────────────

const documentSchema = new Schema<IDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['pdf', 'txt', 'docx', 'other'],
    },
    size: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
  },
  { timestamps: true },
);

// Compound index for faster multi-tenant queries (user × workspace scoping)
documentSchema.index({ userId: 1, workspaceId: 1 });

// ── Model (double-registration guard) ────────────────────────────────────────

const Document =
  (mongoose.models.Document as mongoose.Model<IDocument>) ||
  mongoose.model<IDocument>('Document', documentSchema);

export default Document;
