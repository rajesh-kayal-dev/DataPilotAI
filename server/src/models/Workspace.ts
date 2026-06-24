import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import type { IWorkspace } from '../types/index.js';

// ── Document type ─────────────────────────────────────────────────────────────

export type WorkspaceDocument = HydratedDocument<IWorkspace>;

// ── Schema ────────────────────────────────────────────────────────────────────

// No { timestamps: true } — createdAt is managed manually in the schema.
const workspaceSchema = new Schema<IWorkspace>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Model (double-registration guard) ────────────────────────────────────────

const Workspace =
  (mongoose.models.Workspace as mongoose.Model<IWorkspace>) ||
  mongoose.model<IWorkspace>('Workspace', workspaceSchema);

export default Workspace;
