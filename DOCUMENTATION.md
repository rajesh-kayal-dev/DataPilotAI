# DataPilotAI - Complete Project Documentation

## 1. Project Overview
**DataPilotAI** is a comprehensive, AI-powered document intelligence platform. It enables users to upload, analyze, and extract insights from documents using advanced AI technologies, including Retrieval-Augmented Generation (RAG) and multi-agent AI pipelines. The system allows users to intuitively "chat" with their documents, extract structured data, and manage documents across organized workspaces.

## 2. Core Features
- **Document Chat:** Ask questions and get precise answers based directly on the context of your uploaded documents.
- **Multi-Agent AI:** Run parallel AI agents to perform complex reasoning or data extraction across multiple documents.
- **Semantic Search:** Utilize vector embeddings to search and find exact information across thousands of pages instantly.
- **Smart Outputs:** Extract and export structured data in various formats like JSON, CSV, or Markdown.
- **Workspaces Management:** Organize documents, chats, and configurations logically into distinct projects and workspaces.
- **Authentication:** Secure Google OAuth integration for user login.
- **Payments:** Razorpay integration for handling premium features and subscriptions.
- **Cloud Storage:** AWS S3 used for robust and scalable document storage.

## 3. Technology Stack
The application is built on a modern JavaScript/TypeScript stack:

### Frontend
- **Framework:** React.js with TypeScript
- **Build Tool:** Vite for fast, optimized builds
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **Additional Libraries:** `@react-oauth/google` for authentication, `react-markdown` for chat rendering, `jspdf` and `docx` for document generation.

### Backend
- **Framework:** Node.js with Express.js
- **Database (Relational/Document):** MongoDB (via Mongoose)
- **Database (Vector):** Qdrant (via `@qdrant/js-client-rest`) for semantic search embeddings
- **Caching & Message Queue:** Redis (`@upstash/redis`) and BullMQ for background job processing
- **Cloud Storage:** AWS S3 (`@aws-sdk/client-s3`)
- **Authentication:** Google Auth Library and JWT
- **Payments:** Razorpay
- **Document Processing:** `pdf-parse` for text extraction from PDFs

## 4. Architecture & Data Flow
1. **Document Upload:** Users upload PDFs via the React frontend. Files are sent to the Node backend and stored in AWS S3.
2. **Text Extraction & Chunking:** The backend parses the PDF (using `pdf-parse`). The text is split into structured chunks (approx. 800 characters with a 100-character overlap) to preserve context.
3. **Embedding Generation:** Each chunk is converted into vector embeddings and stored in the **Qdrant** vector database, securely tagged with the specific `documentId` to prevent data mixing.
4. **Query & Retrieval (RAG):** When a user asks a question, the query is embedded. Qdrant performs a similarity search (similarity threshold ~0.35–0.4, top K=3–5) to find the most relevant chunks.
5. **Response Generation:** The LLM (currently a lightweight model, e.g., qwen 1.5b) receives the context and generates an answer strictly based on the provided text.
6. **Caching:** Responses are cached in **Redis** using the `documentId + question` as a key to speed up repeated queries.

## 5. Recent Improvements
The project has recently undergone significant optimizations to improve accuracy and speed:
- **Text Processing:** Fixed extraction issues (e.g., broken words, unwanted spaces) and preserved paragraph structures.
- **Vector Search:** Switched to per-chunk embedding, added strict filtering by `documentId` in Qdrant, and cleared old vectors before reprocessing to stop cross-document contamination.
- **Chat Quality:** Implemented strict instructions for the LLM to only use provided context, adding a graceful fallback ("Answer not found in the document") to prevent hallucination.
- **Frontend Dynamism:** Workspace switching, dynamic file lists, and auto-generated chat titles have been added to improve user experience.
- **Performance:** Reduced unnecessary chunk counts and limited LLM output tokens for a much snappier experience.

## 6. Current Limitations
- **LLM Capacity:** The currently used small LLM model (Qwen 1.5b) may occasionally produce weak or less sophisticated answers.
- **PDF Extraction:** Certain highly-formatted or scanned PDFs still suffer from poor text extraction quality.
- **Retrieval Boundaries:** Retrieval can sometimes miss niche contexts depending on how the initial chunking splits the document.

## 7. Future Goals & Implementation Steps
To further scale and mature DataPilotAI, the following roadmap is planned:
1. **Hybrid Search Integration:** Combine traditional keyword search with vector embeddings to dramatically improve retrieval accuracy for specific nouns and names.
2. **Streaming Responses:** Update the frontend and backend to support token-by-token streaming of LLM responses, significantly improving perceived performance and UX.
3. **Source Highlighting:** Pass chunk metadata to the frontend to visually highlight the exact paragraphs or sentences in the original PDF where the answer was found.
4. **Advanced LLM Models:** Integrate stronger, higher-capacity LLM models (e.g., OpenAI GPT-4, Claude 3, or larger open-source models) for enhanced reasoning and structured data extraction.
5. **OCR Integration:** Implement Optical Character Recognition (OCR) to handle image-heavy or scanned PDFs that currently fail basic text extraction.
