import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import type { IFeedback } from '../types/index.js';

// ── Document type ─────────────────────────────────────────────────────────────

export type FeedbackDocument = HydratedDocument<IFeedback>;

// ── Schema ────────────────────────────────────────────────────────────────────

const feedbackSchema = new Schema<IFeedback>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  type: {
    type: String,
    enum: ['issue', 'recommendation', 'other'],
    default: 'other',
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Model (double-registration guard) ────────────────────────────────────────

const Feedback =
  (mongoose.models.Feedback as mongoose.Model<IFeedback>) ||
  mongoose.model<IFeedback>('Feedback', feedbackSchema);

export default Feedback;
