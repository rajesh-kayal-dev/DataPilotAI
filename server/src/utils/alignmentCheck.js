/**
 * Context-Question Alignment Check (V2 - Semantic)
 * - Measures how well chunks align with the question.
 * - Includes synonym mapping for better semantic matching.
 * - Returns a score between 0 and 1.
 */

const SYNONYM_MAP = {
  specialization: ['elective', 'domain', 'track', 'focus area', 'concentration', 'major', 'stream'],
  elective: ['specialization', 'domain', 'track', 'focus area', 'concentration', 'major', 'stream'],
  subject: ['course', 'module', 'topic', 'unit'],
  course: ['subject', 'module', 'topic', 'unit'],
  fee: ['cost', 'price', 'tuition', 'charges', 'payment'],
  cost: ['fee', 'price', 'tuition', 'charges', 'payment'],
  duration: ['year', 'semester', 'term', 'period'],
  eligibility: ['requirement', 'criteria', 'qualification', 'prerequisite'],
  requirement: ['eligibility', 'criteria', 'qualification', 'prerequisite'],
  career: ['job', 'opportunity', 'placement', 'role', 'position', 'industry'],
  job: ['career', 'opportunity', 'placement', 'role', 'position', 'industry'],
};

const expandWithSynonyms = (word) => {
  const expanded = [word];
  const match = SYNONYM_MAP[word];
  if (match) expanded.push(...match);
  // Also check partial matches (e.g. "specializations" -> "specialization")
  for (const [key, vals] of Object.entries(SYNONYM_MAP)) {
    if (word.startsWith(key) || key.startsWith(word)) {
      expanded.push(key, ...vals);
    }
  }
  return [...new Set(expanded)];
};

export const calculateAlignment = (question, chunks) => {
  if (!chunks || chunks.length === 0) return 0;

  const q = question.toLowerCase();
  const chunksText = chunks.map(c => c.content.toLowerCase()).join(' ');

  // 1. Core Entity Match with Synonym Expansion
  const entities = question.match(/\b[A-Z0-9][a-z0-9]+\b|\b\w{4,}\b/g) || [];
  let entityMatches = 0;
  entities.forEach(e => {
    const eLower = e.toLowerCase();
    const synonyms = expandWithSynonyms(eLower);
    // Check direct match or any synonym match
    const matched = synonyms.some(s => chunksText.includes(s));
    if (matched) entityMatches++;
  });
  const entityScore = entities.length > 0 ? entityMatches / entities.length : 0.5;

  // 2. Question Type Alignment
  let typeScore = 0.5;
  if (q.includes('how many') || q.includes('count')) {
    typeScore = /\d+/.test(chunksText) ? 1 : 0;
  } else if (q.includes('when') || q.includes('date') || q.includes('year')) {
    typeScore = /\d{4}|january|february|march|april|may|june|july|august|september|october|november|december/i.test(chunksText) ? 1 : 0;
  } else if (q.includes('who') || q.includes('person')) {
    typeScore = entityMatches > 0 ? 0.8 : 0.2;
  } else if (q.includes('what') || q.includes('which') || q.includes('list') || q.includes('type') || q.includes('kind')) {
    // List-type questions benefit from entity-rich chunks
    typeScore = entityMatches > 0 ? 0.7 + (entityMatches / entities.length) * 0.3 : 0.3;
  }

  // 3. Longest Common Word Sequence Boost (for phrase-level matching)
  const qWords = q.split(/\W+/).filter(w => w.length > 3);
  let phraseBoost = 0;
  if (qWords.length >= 2) {
    for (let i = 0; i < qWords.length - 1; i++) {
      const bigram = `${qWords[i]} ${qWords[i + 1]}`;
      if (chunksText.includes(bigram)) phraseBoost += 0.1;
    }
  }
  const phraseScore = Math.min(phraseBoost, 0.3);

  return Math.min((entityScore * 0.5) + (typeScore * 0.3) + (phraseScore), 1.0);
};
