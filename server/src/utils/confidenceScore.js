import { calculateAlignment } from './alignmentCheck.js';

/**
 * Advanced Multi-Factor Confidence Scoring (V2)
 * Now includes Question-Context Alignment.
 * Thresholds tuned for production balance.
 */
export const calculateConfidence = (question, chunks) => {
  if (!chunks || chunks.length === 0) {
    return { score: 0, alignment: 0, isReliable: false };
  }

  const q = question.toLowerCase();
  const qWords = q.split(/\W+/).filter(w => w.length > 3);
  const combinedText = chunks.map(c => c.content.toLowerCase()).join(' ');

  // 1. Vector Similarity (30%)
  const vectorScore = chunks.reduce((acc, c) => acc + c.score, 0) / chunks.length;

  // 2. Keyword Overlap (25%)
  let matchCount = 0;
  qWords.forEach(word => {
    if (combinedText.includes(word)) matchCount++;
  });
  const keywordScore = qWords.length > 0 ? matchCount / qWords.length : 0.5;

  // 3. Chunk Consistency (20%)
  const consistencyScore = Math.min(chunks.length / 2, 1); // Less strict

  // 4. Question Alignment (25%)
  const alignmentScore = calculateAlignment(question, chunks);

  // Weighted Final Score
  const finalScore = (vectorScore * 0.3) + 
                     (keywordScore * 0.25) + 
                     (consistencyScore * 0.2) + 
                     (alignmentScore * 0.25);

  // Relaxed Thresholds for better UX:
  // We want to avoid saying "I don't know" too often if there is decent context.
  return {
    score: parseFloat(finalScore.toFixed(2)),
    alignment: parseFloat(alignmentScore.toFixed(2)),
    isReliable: finalScore >= 0.30 && alignmentScore >= 0.20 
  };
};
