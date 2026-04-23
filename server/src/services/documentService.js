import Document from '../models/Document.js';
import { chunkAndEmbed } from './ragService.js';

export const uploadDocument = async (file, userId) => {
  try {
    const document = new Document({
      name: file.originalname,
      type: file.mimetype.split('/')[1], // e.g., "pdf"
      size: file.size,
      user: userId,
      chunks: [], // Will be populated later (RAG processing)
      status: 'uploaded',
    });

    await document.save();
    return { success: true, document };
  } catch (error) {
    throw new Error(`Failed to upload document: ${error.message}`);
  }
};

export const processDocument = async (documentId) => {
  try {
    const document = await Document.findById(documentId);
    if (!document) throw new Error('Document not found');

    // TODO: Extract text from file (e.g., PDF, TXT)
    // For now, mock text extraction
    const mockText = 'This is a sample document text. It will be split into chunks...';

    // Chunk and embed
    const chunks = chunkAndEmbed(mockText);

    // Update document
    document.chunks = chunks;
    document.status = 'processed';
    await document.save();

    return { success: true, document };
  } catch (error) {
    throw new Error(`Failed to process document: ${error.message}`);
  }
};