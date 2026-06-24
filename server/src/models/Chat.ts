import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import type { IChat, IMessage } from '../types/index.js';

// ── Document types ────────────────────────────────────────────────────────────

export type ChatDocument = HydratedDocument<IChat>;

// ── Message sub-document schema ───────────────────────────────────────────────

const messageSchema = new Schema<IMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  source: {
    type: String,
  },
  modelName: {
    type: String,
  },
  confidence: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Chat schema ───────────────────────────────────────────────────────────────

const chatSchema = new Schema<IChat>({
  title: {
    type: String,
    default: 'New Chat',
  },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  activeDocumentId: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Model (double-registration guard) ────────────────────────────────────────

const Chat =
  (mongoose.models.Chat as mongoose.Model<IChat>) ||
  mongoose.model<IChat>('Chat', chatSchema);

export default Chat;
