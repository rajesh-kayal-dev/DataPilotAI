/**
 * Context-Question Alignment Check
 * Measures how well the retrieved chunks actually align with the user's question.
 * Returns a score between 0 and 1.
 */
export const calculateAlignment = (question, chunks) => {
  if (!chunks || chunks.length === 0) return 0;

  const q = question.toLowerCase();
  const chunksText = chunks.map(c => c.content.toLowerCase()).join(' ');

  // 1. Core Entity Match
  // Extracts potential key entities (simple capitalized or long words)
  const entities = question.match(/\b[A-Z0-9][a-z0-9]+\b|\b\w{6,}\b/g) || [];
  let entityMatches = 0;
  entities.forEach(e => {
    if (chunksText.includes(e.toLowerCase())) entityMatches++;
  });
  const entityScore = entities.length > 0 ? entityMatches / entities.length : 0.5;

  // 2. Question Type Alignment
  // Checks if the chunks contain answer-type keywords (numbers for "how many", dates for "when", etc.)
  let typeScore = 0.5;
  if (q.includes('how many') || q.includes('count')) {
    typeScore = /\d+/.test(chunksText) ? 1 : 0;
  } else if (q.includes('when') || q.includes('date') || q.includes('year')) {
    typeScore = /\d{4}|january|february|march|april|may|june|july|august|september|october|november|december/i.test(chunksText) ? 1 : 0;
  } else if (q.includes('who') || q.includes('person')) {
    typeScore = entityMatches > 0 ? 0.8 : 0.2;
  }

  // Final Alignment Score
  return (entityScore * 0.6) + (typeScore * 0.4);
};
