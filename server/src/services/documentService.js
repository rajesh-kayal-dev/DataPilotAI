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

    // 3. Clean & Standard Recursive Chunking
    text = text.replace(/-\s*\n/g, "").replace(/\r\n/g, "\n").trim();
    
    const CHUNK_SIZE = 1000;
    const CHUNK_OVERLAP = 200;
    const chunks = [];
    
    // Recursive Split Logic
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
          
          // If a single paragraph is larger than CHUNK_SIZE, split it by newlines
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

    // 4. Create Embeddings & Index (Optimized with Parallel Processing)
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

  // 1. Delete from Vector DB
  await deleteVectorsByDocId(documentId);
  
  // 2. Delete local file
  if (fs.existsSync(document.filePath)) fs.unlinkSync(document.filePath);
  
  // 3. Delete from Memory Cache
  try {
    const { redisClient } = await import('../config/redis.js');
    if (redisClient) {
      await redisClient.del(`cache:full_doc:${documentId}`);
    }
  } catch (error) {
    console.error('Failed to clear redis cache for deleted doc:', error.message);
  }

  // 4. Delete from Database
  await Document.findByIdAndDelete(documentId);
  
  return { success: true };
};