# Project Updates

## 1. PDF Processing Fixes

- Improved text extraction from PDF files
- Fixed broken words like "Dat a" → "Data"
- Cleaned unwanted spaces and formatting issues
- Preserved paragraph structure for better readability

Reason:
Better text quality improves embedding accuracy and retrieval results.

---

## 2. Chunking Improvements

- Switched to structured chunking instead of random splitting
- Used chunk size around 800 characters
- Added overlap of ~100 characters

Reason:
This helps preserve context between chunks and improves search relevance.

---

## 3. Embedding Optimization

- Moved to per-chunk embedding instead of batch processing
- Added error handling for failed chunks
- Reduced overall processing issues

Reason:
More stable embedding process and better fault tolerance.

---

## 4. Vector Database (Qdrant) Fixes

- Ensured strict filtering by documentId
- Prevented mixing of chunks from different documents
- Cleared old vectors before re-processing

Reason:
Fixes incorrect answers coming from unrelated documents.

---

## 5. Retrieval Logic Fix

- Lowered similarity threshold to ~0.35–0.4
- Increased top results (topK = 3–5)
- Added fallback when no strong match is found

Reason:
Improves chances of getting correct context for answers.

---

## 6. Chat Response Improvements

- Forced system to answer only from retrieved context
- Added fallback response:
  "Answer not found in the document"
- Structured responses for better readability

Reason:
Reduces hallucination and ensures answers come from the document.

---

## 7. Redis Caching

- Implemented caching for repeated queries
- Stored responses using documentId + question

Reason:
Faster responses for repeated queries.

---

## 8. Frontend Improvements

- Workspace switching made dynamic
- Chat creation linked to workspace
- Chat title auto-generated from first question
- File list connected to workspace data

Reason:
Removed static UI and made the system fully dynamic.

---

## 9. Performance Improvements

- Reduced unnecessary chunk count
- Limited LLM output tokens
- Improved overall response speed

Reason:
Faster and more efficient system performance.

---

## 10. Current Limitations

- Small LLM model (qwen 1.5b) may give weak answers
- Some PDFs have poor text extraction quality
- Retrieval can still be improved further

---

## 11. Next Steps

- Add hybrid search (keyword + vector)
- Improve UI with streaming responses
- Add source highlighting in answers
- Integrate stronger LLM models