import { generateEmbedding } from '../utils/embedding.js';

export const chunkText = (text) => {
  const paragraphs = text.split(/\n\n/);
  const chunks = [];
  let currentChunk = "";
  const targetSize = 800;
  const overlapSize = 120;

  paragraphs.forEach((para) => {
    // Basic validation: if a single paragraph is too large, split it further
    if (para.length > targetSize) {
      const subChunks = para.match(new RegExp(`.{1,${targetSize}}`, 'g')) || [];
      subChunks.forEach(sc => {
        if (sc.length > 1000) sc = sc.slice(0, 1000); // Hard trim
        chunks.push(sc);
      });
      return;
    }

    if ((currentChunk.length + para.length) < targetSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    } else {
      if (currentChunk) {
        let finalChunk = currentChunk;
        if (finalChunk.length > 1000) finalChunk = finalChunk.slice(0, 1000); // Validation
        chunks.push(finalChunk);
      }
      
      const overlap = currentChunk.slice(-overlapSize);
      currentChunk = overlap + "\n\n" + para;
    }
  });

  if (currentChunk) {
    let finalChunk = currentChunk;
    if (finalChunk.length > 1000) finalChunk = finalChunk.slice(0, 1000);
    chunks.push(finalChunk);
  }

  const avgSize = chunks.reduce((acc, c) => acc + c.length, 0) / chunks.length;
  console.log(`Chunking Results: Total Chunks: ${chunks.length}, Avg Size: ${Math.round(avgSize)} chars`);
  return chunks;
};

export const createEmbeddings = async (chunks) => {
  const results = [];
  
  console.log(`Starting Embeddings: Processing ${chunks.length} chunks individually...`);

  for (let i = 0; i < chunks.length; i++) {
    try {
      const embedding = await generateEmbedding(chunks[i]);
      results.push({
        content: chunks[i],
        embedding,
        chunkIndex: i,
      });
    } catch (err) {
      console.error(`Embedding failed for chunk ${i}:`, err.message);
      // Skip failed chunk to keep process alive
    }
  }

  return results;
};

export const retrieveContext = async (query) => {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const results = await searchVectors(queryEmbedding);

    const context = results
      .map(item => item.payload.content)
      .join('\n\n');

    return context;
  } catch (error) {
    throw new Error('Context retrieval failed');
  }
};