import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import type { IUser } from '../types/index.js';

// ── Document type ─────────────────────────────────────────────────────────────

export type UserDocument = HydratedDocument<IUser>;

// ── Schema ────────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    // Optional — Google OAuth accounts have no password
    password: {
      type: String,
    },
    googleId: {
      type: String,
      unique: true,
      // sparse: allows multiple docs with no googleId without violating unique
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    // Granular plan tracking for billing logic
    planId: {
      type: String,
      enum: ['free', 'pro_monthly', 'pro_6month'],
      default: 'free',
    },
    subscriptionExpiry: {
      type: Date,
    },
    // Stacked / queued upgrade — null means no pending plan
    queuedPlanId: {
      type: String,
      enum: [null, 'pro_monthly', 'pro_6month'],
      default: null,
    },
    selectedModel: {
      type: String,
      default: 'mimo-flash',
    },
    ragMode: {
      type: String,
      enum: ['hybrid', 'strict'],
      default: 'hybrid',
    },
  },
  { timestamps: true },
);

// ── Model (double-registration guard) ────────────────────────────────────────

const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>('User', userSchema);

export default User;
