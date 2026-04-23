import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
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
    chunks: [
      {
        content: {
          type: String,
          required: true,
        },
        embedding: {
          type: [Number], // Store vector embeddings
          required: false,
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'processed', 'failed'],
      default: 'uploaded',
    },
  },
  {
    timestamps: true, 
  }
);

const Document = mongoose.model('Document', documentSchema);

export default Document;