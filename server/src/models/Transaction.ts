import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import type { ITransaction } from '../types/index.js';

// ── Document type ─────────────────────────────────────────────────────────────

export type TransactionDocument = HydratedDocument<ITransaction>;

// ── Schema ────────────────────────────────────────────────────────────────────

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'captured', 'failed'],
      default: 'pending',
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true },
);

// ── Model (double-registration guard) ────────────────────────────────────────

const Transaction =
  (mongoose.models.Transaction as mongoose.Model<ITransaction>) ||
  mongoose.model<ITransaction>('Transaction', transactionSchema);

export default Transaction;
