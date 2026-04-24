import { generateEmbedding } from '../utils/embedding.js';
import { searchVectors } from '../services/vector/qdrantService.js';

export const runResearchAgent = async (question, documentId) => {
  console.log(`Research Agent: Searching for "${question}" in doc: ${documentId}`);
  
  const queryEmbedding = await generateEmbedding(question);
  const results = await searchVectors(queryEmbedding, documentId);

  // 1. Log all retrieved docIds to verify filtering
  const retrievedDocIds = [...new Set(results.map(r => r.docId))];
  console.log(`Retrieved Doc IDs: ${JSON.stringify(retrievedDocIds)}`);

  // 2. Filter by threshold (0.4)
  let filteredResults = results.filter(item => item.score >= 0.4);
  console.log(`Chunks above threshold (0.4): ${filteredResults.length}/${results.length}`);

  // 3. Fallback: if nothing matches threshold, but we have results, take best 1 IF it's not totally irrelevant
  if (filteredResults.length === 0 && results.length > 0 && results[0].score > 0.25) {
    console.log(`Low confidence match (score: ${results[0].score}), using as fallback.`);
    filteredResults = [results[0]];
  }

  // 4. Take top 5
  const topChunks = filteredResults.slice(0, 5);
  
  // 5. Build context and validate
  let context = topChunks.map(item => item.content).join("\n\n");
  
  // Remove duplicate sentences
  const sentences = context.split(". ");
  const uniqueSentences = [...new Set(sentences)];
  context = uniqueSentences.join(". ");

  // 6. Hard limit and length validation
  if (context.length > 2000) {
    context = context.slice(0, 2000);
  }

  if (context.length < 200) {
    console.log("Context too short (< 200 chars), returning empty to trigger fallback.");
    context = "";
  }

  console.log(`Research Complete. Selected Chunks: ${topChunks.length}. Top Score: ${results[0]?.score || 0}`);
  return { context, topChunks };
};