import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Tesseract from 'tesseract.js';
import { createCanvas } from 'canvas';
import Document from '../models/Document.js';
import { generateEmbedding } from './embeddingService.js';
import { insertVectors, deleteVectorsByDocId } from './vectorService.js';
import { v4 as uuidv4 } from 'uuid';
import { createRequire } from 'module';
import { uploadToS3, deleteFromS3, getFileFromS3 } from './s3Service.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Document Service (Production V4 - Cloud Migration)
 * Fully migrated to AWS S3. Local filesystem code removed.
 */

const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

const extractWithOCR = async (dataBuffer) => {
  const uint8 = new Uint8Array(dataBuffer);
  const doc = await pdfjsLib.getDocument({ data: uint8, useWorkerFetch: false, disableWorker: true }).promise;
  let fullText = '';

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    const pngBuffer = canvas.toBuffer('image/png');
    const { data } = await Tesseract.recognize(pngBuffer, 'eng', {
      logger: () => {},
    });
    fullText += data.text + '\n\n';
  }

  return fullText.trim();
};

export const uploadDocument = async (file, userId, workspaceId) => {
  try {
    // 1. Upload to S3
    const { key, url } = await uploadToS3(file.buffer, file.originalname, file.mimetype);

    // 2. Save record to DB
    const document = new Document({
      name: file.originalname,
      type: file.mimetype.split('/')[1],
      size: file.size,
      filePath: url, // Store full S3 URL
      s3Key: key,    // Store key for deletion
      userId: userId,
      workspaceId,
      status: 'pending',
    });

    await document.save();
    return { success: true, document };
  } catch (error) {
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

const chunkAndEmbed = async (documentId, text) => {
  text = text.replace(/-\s*\n/g, "").replace(/\r\n/g, "\n").trim();

  const CHUNK_SIZE = 700;
  const CHUNK_OVERLAP = 120;
  const chunks = [];

  const separators = ["\n\n", "\n", ". ", " "];

  const splitText = (input, size, overlap) => {
    let result = [];
    let paragraphs = input.split(separators[0]);
    let currentChunk = "";
    for (let p of paragraphs) {
      if ((currentChunk + p).length <= size) {
        currentChunk += (currentChunk ? "\n\n" : "") + p;
      } else {
        if (currentChunk) result.push(currentChunk);
        if (p.length > size) {
          let lines = p.split(separators[1]);
          let lineChunk = "";
          for (let l of lines) {
            if ((lineChunk + l).length <= size) {
              lineChunk += (lineChunk ? "\n" : "") + l;
            } else {
              if (lineChunk) result.push(lineChunk);
              lineChunk = l;
            }
          }
          currentChunk = lineChunk;
        } else {
          currentChunk = p;
        }
      }
    }
    if (currentChunk) result.push(currentChunk);
    return result;
  };

  const finalChunks = splitText(text, CHUNK_SIZE, CHUNK_OVERLAP);
  finalChunks.forEach(c => {
    if (c.trim().length > 40) chunks.push(c.trim());
  });

  const CONCURRENCY_LIMIT = 5;
  const points = [];
  for (let i = 0; i < chunks.length; i += CONCURRENCY_LIMIT) {
    const batch = chunks.slice(i, i + CONCURRENCY_LIMIT);
    const batchPromises = batch.map(async (chunk, index) => {
      const actualIndex = i + index;
      const embedding = await generateEmbedding(chunk);
      return {
        id: uuidv4(),
        vector: embedding,
        payload: {
          docId: documentId.toString(),
          content: chunk,
          chunkIndex: actualIndex,
        },
      };
    });
    const batchResults = await Promise.all(batchPromises);
    points.push(...batchResults);
  }

  const result = await insertVectors(points);
  if (result && !result.success) {
    throw new Error(result.error || 'Failed to insert vectors into database');
  }
};

export const processDocument = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) throw new Error('Document not found');

  try {
    await Document.findByIdAndUpdate(documentId, { status: 'processing' });

    // 1. Clear old vectors
    await deleteVectorsByDocId(documentId);

    // 2. Extract Text from S3
    const s3Stream = await getFileFromS3(document.s3Key);
    const dataBuffer = await streamToBuffer(s3Stream);

    let text = '';
    if (document.type === 'pdf') {
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text?.trim() || '';
      if (!text || text.length < 20) {
        console.log('No selectable text, running OCR...');
        text = await extractWithOCR(dataBuffer);
      }
    } else {
      text = dataBuffer.toString('utf8');
    }

    if (!text || text.trim().length < 20) throw new Error('No readable text found in document');

    // 3. Chunk & Embed
    await chunkAndEmbed(documentId, text);

    await Document.findByIdAndUpdate(documentId, { status: 'completed' });
    console.log('Your document has been uploaded');
    return { success: true };

  } catch (error) {
    await Document.findByIdAndUpdate(documentId, {
      status: 'failed',
      $inc: { retryCount: 1 },
      lastError: error.message
    });
    throw error;
  }
};

export const reembedDocument = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) throw new Error('Document not found');

  try {
    await Document.findByIdAndUpdate(documentId, { status: 'processing', lastError: null });

    // 1. Clear old vectors
    await deleteVectorsByDocId(documentId);

    // 2. Get text from S3 (reuse existing file)
    const s3Stream = await getFileFromS3(document.s3Key);
    const dataBuffer = await streamToBuffer(s3Stream);

    let text = '';
    if (document.type === 'pdf') {
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text?.trim() || '';
      if (!text || text.length < 20) {
        console.log('No selectable text, running OCR...');
        text = await extractWithOCR(dataBuffer);
      }
    } else {
      text = dataBuffer.toString('utf8');
    }

    if (!text || text.trim().length < 20) throw new Error('No readable text found in document');

    // 3. Chunk & Embed
    await chunkAndEmbed(documentId, text);

    await Document.findByIdAndUpdate(documentId, { status: 'completed' });
    console.log('Document re-embedded successfully');
    return { success: true };

  } catch (error) {
    await Document.findByIdAndUpdate(documentId, {
      status: 'failed',
      $inc: { retryCount: 1 },
      lastError: error.message
    });
    throw error;
  }
};

export const listDocuments = async (userId, workspaceId) => {
  return await Document.find({ userId, workspaceId }).sort({ createdAt: -1 });
};

export const deleteDocument = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) throw new Error('Document not found');

  // 1. Delete from Vector DB
  await deleteVectorsByDocId(documentId);
  
  // 2. Delete from S3
  await deleteFromS3(document.s3Key);
  
  // 3. Delete from Memory Cache
  try {
    const { redisClient } = await import('../config/redis.js');
    if (redisClient) {
      await redisClient.del(`cache:full_doc:${documentId}`);
    }
  } catch (error) {
    console.error('Failed to clear redis cache:', error.message);
  }

  // 4. Delete from Database
  await Document.findByIdAndDelete(documentId);
  
  return { success: true };
};