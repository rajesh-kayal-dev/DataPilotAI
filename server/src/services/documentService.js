import Document from '../models/Document.js';
import { chunkText, createEmbeddings } from './ragService.js';
import { insertVectors, deleteVectors } from './vector/qdrantService.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const uploadDocument = async (file, userId, workspaceId) => {
  try {
    const document = new Document({
      name: file.originalname,
      type: file.mimetype.split('/')[1],
      size: file.size,
      filePath: file.path,
      user: userId,
      workspaceId,
      status: 'uploaded',
    });

    await document.save();
    return { success: true, document };
  } catch (error) {
    throw new Error(`Failed to upload document: ${error.message}`);
  }
};

const cleanText = (text) => {
  if (!text) return "";
  
  return text
    // 1. Fix broken words with hyphens at line breaks
    .replace(/-\s*\n/g, "")
    // 2. Fix spaced out letters like "S t r u c t u r e s"
    // This regex looks for 3 or more single letters separated by spaces
    .replace(/(?:\b[A-Za-z]\s+){2,}[A-Za-z]\b/g, (match) => match.replace(/\s+/g, ""))
    // 3. Fix broken words like "Dat a"
    .replace(/(\b[A-Z][a-z]*)\s+(?=[a-z]\b)/g, "$1")
    // 4. Normalize newlines
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    // 5. Collapse horizontal spaces (preserve newlines)
    .replace(/[^\S\r\n]+/g, " ")
    .trim();
};

export const processDocument = async (documentId) => {
  try {
    const document = await Document.findById(documentId);
    if (!document) throw new Error('Document not found');

    document.status = 'processing';
    await document.save();

    // Reset Qdrant vectors for this document before reprocessing
    await deleteVectors(documentId);

    let text = '';

    if (document.type === 'pdf') {
      const dataBuffer = fs.readFileSync(document.filePath);

      const pdfData = await pdfParse(dataBuffer);

      text = pdfData.text;
    } else {
      text = fs.readFileSync(document.filePath, 'utf8');
    }

    if (!text || text.trim().length < 20) {
      throw new Error('Empty or invalid extracted text');
    }

    text = cleanText(text);
    console.log('CLEANED TEXT PREVIEW:', text.slice(0, 200));

    const chunks = chunkText(text);

    if (!chunks || chunks.length === 0) {
      throw new Error('Chunking failed');
    }

    const embeddedChunks = await createEmbeddings(chunks);

    const points = embeddedChunks.map((chunk) => ({
      id: uuidv4(),
      vector: chunk.embedding,
      payload: {
        docId: documentId.toString(),
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
      },
    }));

    await insertVectors(points);

    document.status = 'ready';
    await document.save();

    return { success: true };

  } catch (error) {
    console.error('Processing error:', error.message);

    await Document.findByIdAndUpdate(documentId, {
      status: 'failed',
    });

    return { success: false };
  }
};

export const listDocuments = async (userId, workspaceId) => {
  const query = { user: userId };
  if (workspaceId) query.workspaceId = workspaceId;
  return await Document.find(query).sort({ createdAt: -1 });
};

export const deleteDocument = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) throw new Error('Document not found');

  // 1. Remove from Qdrant
  await deleteVectors(documentId);

  // 2. Remove file from disk
  if (fs.existsSync(document.filePath)) {
    fs.unlinkSync(document.filePath);
  }

  // 3. Remove from MongoDB
  await Document.findByIdAndDelete(documentId);

  return { success: true };
};