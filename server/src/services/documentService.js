import Document from '../models/Document.js';
import { generateEmbedding } from './embeddingService.js';
import { insertVectors, deleteVectorsByDocId } from './vectorService.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Document Service (Production V3)
 * Responsible for RAG pipeline with robust status tracking.
 */

export const uploadDocument = async (file, userId, workspaceId) => {
  try {
    const document = new Document({
      name: file.originalname,
      type: file.mimetype.split('/')[1],
      size: file.size,
      filePath: file.path,
      userId: userId,
      workspaceId,
      status: 'pending',
    });

    await document.save();
    return { success: true, document };
  } catch (error) {
    throw new Error(`Failed to upload: ${error.message}`);
  }
};

export const processDocument = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) throw new Error('Document not found');

  try {
    await Document.findByIdAndUpdate(documentId, { status: 'processing' });

    // 1. Clear old vectors
    await deleteVectorsByDocId(documentId);

    // 2. Extract Text
    let text = '';
    if (document.type === 'pdf') {
      const dataBuffer = fs.readFileSync(document.filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else {
      text = fs.readFileSync(document.filePath, 'utf8');
    }

    if (!text || text.trim().length < 20) throw new Error('No readable text found in document');

    // 3. Clean & Chunk
    text = text.replace(/-\s*\n/g, "").replace(/\r\n/g, "\n").trim();
    const chunks = text.split('\n\n').filter(c => c.length > 50);

    // 4. Create Embeddings & Index
    const points = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      points.push({
        id: uuidv4(),
        vector: embedding,
        payload: {
          docId: documentId.toString(),
          content: chunks[i],
          chunkIndex: i,
        },
      });
    }

    // 5. Save to Vector DB
    await insertVectors(points);

    await Document.findByIdAndUpdate(documentId, { status: 'completed' });
    return { success: true };

  } catch (error) {
    await Document.findByIdAndUpdate(documentId, { 
      status: 'failed',
      $inc: { retryCount: 1 },
      lastError: error.message 
    });
    throw error; // Re-throw for BullMQ retry
  }
};

export const listDocuments = async (userId, workspaceId) => {
  return await Document.find({ userId, workspaceId }).sort({ createdAt: -1 });
};

export const deleteDocument = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) throw new Error('Document not found');

  await deleteVectorsByDocId(documentId);
  if (fs.existsSync(document.filePath)) fs.unlinkSync(document.filePath);
  await Document.findByIdAndDelete(documentId);
  return { success: true };
};