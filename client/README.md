# DataPilotAI — Product Requirements Document
**Industry:** AI SaaS Tools | **Stack:** MERN + AI Layer | **Phases:** 4

---

## 1. Product Overview

DataPilotAI is an AI-powered SaaS platform that lets teams upload internal documents (PDFs, text files) and interact with them via a smart multi-agent chat interface. Instead of searching manually, employees just ask questions and get accurate, document-backed answers.

### Core Problems Solved

| Priority | Problem |
|----------|---------|
| P0 | Employees waste time searching across PDFs and docs |
| P1 | Repeated questions to teammates — onboarding, HR, policy |
| P1 | No actionable output from raw documents |

### What It Does

- Understands company documents
- Gives accurate, context-grounded answers with source citations
- Reduces repetitive internal questions
- Helps complete tasks faster with actionable outputs

---

👉 **Added: Who Is This For**

### Target Users

| User Type | Use Case |
|-----------|----------|
| **HR Teams** | Answer policy and onboarding questions without manual searching |
| **Legal Teams** | Query contracts, NDAs, compliance docs and get cited answers |
| **Startup Founders** | Get instant answers from SOPs, investor decks, product specs |
| **Product Managers** | Summarize PRDs, sprint notes, and meeting docs on demand |
| **Researchers** | Search across papers and reports with semantic understanding |

The primary user is a **non-technical professional** who works with a large volume of internal documents and needs fast, accurate answers — not a developer or data scientist.

---

👉 **Added: Real-World Use Cases**

### Use Case 1 — HR Onboarding Assistant
A new employee joins a company. Instead of asking their manager basic policy questions ("How many leave days do I get?", "What's the reimbursement policy?"), they open DataPilotAI, ask in plain English, and get a precise answer pulled directly from the HR policy PDF — with the source paragraph highlighted.

### Use Case 2 — Legal Contract Review
A legal team has 50+ vendor contracts. A lawyer needs to know which contracts include a specific termination clause. They upload all contracts to DataPilotAI, ask "Which contracts have a 30-day termination notice clause?", and get a cited, summarised answer across all documents in seconds.

---

## 2. Key Features

### 2.1 Auth System
- User signup and login (email-based)
- Email verification flow
- Google OAuth login
- JWT-based authentication (custom implementation)
- Protected routes, per-user workspace isolation

### 2.2 Document Upload + RAG Pipeline
- Upload PDF files via drag-drop or click
- Text extraction using `pdf-parse`
- Custom text chunking service
- Embedding generation per chunk
- In-memory vector store (Phase 1) → ChromaDB/pgvector (Phase 4)
- Stored knowledge base per user workspace
- 👉 **Added:** File type validation — only `.pdf`, `.txt` allowed. Max 10MB enforced before upload starts
- 👉 **Added:** Duplicate file detection by hash before processing
- 👉 **Added:** Upload progress indicator (0–100%) with status: `Uploading → Extracting → Chunking → Embedding → Ready`

### 2.3 Multi-Agent AI System
- Orchestrator routes to correct sub-agent based on query type
- Research Agent handles RAG retrieval
- Chat Agent handles general conversation
- Action Agent generates structured outputs
- Reviewer Agent fact-checks answers
- Writer Agent formats final response
- 👉 **Added:** Each agent has a timeout of 15s. If exceeded, fallback response is triggered

### 2.4 Smart Query Routing
- Detects if query needs RAG, general chat, or task action
- Routes automatically without user input
- Reduces unnecessary LLM calls

### 2.5 Actionable Responses
- Not just Q&A — generates email drafts, summaries, step-by-step guides
- Suggest next steps based on document context
- Summarize policies, onboarding docs, SOPs

### 2.6 Chat History + Caching
- Full conversation history saved in MongoDB
- Redis caching for repeated queries
- Sidebar with past chats, click to restore
- 👉 **Added:** Lazy loading for large chat histories (load last 20 messages, scroll up to fetch more)
- 👉 **Added:** Chat rename and delete from sidebar

### 2.7 Workspace Structure
- Each user has an isolated workspace
- Upload docs, manage chats, all scoped to workspace context
- Scalable for future team/organization-level workspaces
- 👉 **Added:** Workspace ID included in all document and chat records for clean multi-tenancy later

### 2.8 Observability + Logging
- Request logging on all API endpoints
- Error tracking with stack traces
- Agent flow debug logs for production health monitoring

---

👉 **Added: 2.9 Document Viewer**
- Inline PDF preview panel when user clicks a document
- Source chunks used in the last AI answer are highlighted in the viewer
- Chunk highlight is cross-referenced by chunk index stored in `sourceChunks` array in the message

---

👉 **Added: 2.10 Chat Citations**
- Every AI response from the Research Agent includes a `sourceChunks` array
- The frontend renders a collapsible "Sources" section below each AI message
- Each source shows: document name, chunk excerpt, and page estimate
- Clicking a source opens the Document Viewer at that chunk

---

👉 **Added: 2.11 Streaming Responses**
- AI responses stream token-by-token using Server-Sent Events (SSE)
- The Writer Agent streams directly to the frontend
- A blinking cursor is shown while streaming is active
- If streaming fails mid-way, the partial response is saved and an error toast appears

---

👉 **Added: 2.12 UI States**

#### Loading States
| Trigger | UI Shown |
|---------|----------|
| File uploading | Progress bar + step label (`Chunking...`, `Embedding...`) |
| AI generating response | Typing indicator + agent name (`Research Agent working...`) |
| Documents page loading | Skeleton cards |
| Chat history loading | Skeleton list items |

#### Empty States
| Screen | Empty State Message |
|--------|---------------------|
| Documents page | "No documents yet. Upload your first PDF to get started." + Upload button |
| Chat page (no docs) | "Upload a document first to start chatting." + link to Documents page |
| Chat page (new chat) | "Ask anything about your documents." with example prompts |
| Chat history | "No past chats. Start a new conversation." |

#### Error States
| Error | User-Facing Message |
|-------|---------------------|
| Upload fails | "Upload failed. Check your file type and size (max 10MB)." |
| AI fails | "Something went wrong. Please try again." + Retry button |
| No relevant chunks found | "I couldn't find relevant information in your documents for this question." |
| Network error | "Connection lost. Please check your internet and retry." |

---

## 3. System Architecture

```
Frontend (React.js + Tailwind )
        ↓ HTTP / REST + SSE (streaming)
Backend API (Express.js) + JWT Auth Middleware + Rate Limiter
        ↓
Orchestrator Agent
        ↓
Research Agent / Chat Agent / Action Agent
        ↓
Reviewer Agent → Writer Agent (streams output)
        ↓
RAG Pipeline (chunks + embeddings)  +  LLM (AgentRouter / Ollama fallback)
        ↓
MongoDB + Redis Cache
```

### RAG Document Pipeline

```
Upload PDF → Multer → File Validation → pdf-parse → Chunking Service → Embedding Service → Vector Store → Stored Knowledge Base
```

👉 **Added: Background Processing**

PDF processing (extract → chunk → embed → store) is **not done in the upload request**. It runs in the background after the file is saved. This keeps the `/upload` API fast and non-blocking.

**How it works:**
1. `/upload` receives the file, validates it, saves it to disk, creates a DB record with `status: 'processing'`, and immediately returns `202 Accepted` with the document ID
2. A background worker (async function, or queue in Phase 4) picks up the job and runs the full pipeline
3. When done, it updates the document record to `status: 'ready'` (or `status: 'failed'` on error)
4. The frontend polls `GET /documents/:id/status` every 3 seconds until status is `ready` or `failed`

### Query Flow (RAG + AI)

```
User Question → Debounce (300ms) → Embedding (question) → Vector Search (topK=5) → Chunk Trimming → Context Build → AI Agents Process → Stream Final Answer → Save to DB
```

---

## 4. Multi-Agent System Design

> This is the core premium feature of the product.

| Agent | Role | Model Used |
|-------|------|-----------|
| **Orchestrator Agent** | Master controller. Reads intent, routes to correct sub-agent, manages entire flow | `deepseek-v3.1` |
| **Research Agent** | Handles document queries. Runs RAG retrieval — embeds question, vector search, builds context | `deepseek-v3.1` |
| **Chat Agent** | Handles general conversation that doesn't need RAG. Direct LLM call with history | `deepseek-v3.1` |
| **Action Agent** | Generates structured outputs — email drafts, summaries, step-by-step plans | `deepseek-v3.1` |
| **Reviewer Agent** | Fact-checks answer against retrieved context. Removes hallucinations | `deepseek-v3.1` |
| **Writer Agent** | Final output formatter. Makes answer clean, readable, well-structured | `claude-opus-4-6` |

---

👉 **Added: Agent Flow (Step-by-Step)**

```
User sends message
        ↓
Orchestrator Agent — classifies intent
        ↓
  ┌─────────────────────────────────┐
  │ Intent: RAG query              → Research Agent
  │ Intent: General chat           → Chat Agent
  │ Intent: Action/output task     → Action Agent
  └─────────────────────────────────┘
        ↓
Reviewer Agent — validates answer against source chunks
        ↓
Writer Agent — formats and streams final response to frontend
```

#### Agent Trigger Conditions

| Condition | Agent Triggered |
|-----------|----------------|
| Query contains document-specific words ("in the contract", "according to", "what does the policy say") | Research Agent |
| Query is conversational or general knowledge ("what is GDPR?", "summarise this") | Chat Agent |
| Query requests a structured output ("write an email", "create a checklist", "draft a plan") | Action Agent |
| Any agent produces a response | Reviewer Agent always runs next |
| Reviewer approves or corrects | Writer Agent always runs last |

---

👉 **Added: RAG Prompt Structure**

The Research Agent uses the following prompt template:

```
You are a document assistant. Answer the user's question using ONLY the context below.
If the answer is not found in the context, say: "I couldn't find this in your documents."

Context:
---
{chunk_1}
---
{chunk_2}
---
{chunk_3}

User Question: {user_question}

Answer:
```

- Max context window used: **6,000 tokens** (safe buffer below model limits)
- If retrieved chunks exceed limit, trim lowest-score chunks first
- Always cite chunk index in the response metadata

👉 **Added: Context Budget Breakdown**

Every request to the LLM must stay within a fixed token budget. Split as follows:

| Slot | Content | Max Tokens |
|------|---------|-----------|
| System prompt | Agent instructions | ~300 |
| Chat history | Last 5–6 messages only | ~1,500 |
| RAG chunks | Top 3–5 chunks (trimmed by score) | ~3,500 |
| User question | Current message | ~200 |
| **Total** | | **~5,500 / 6,000** |

**Rules:**
- Chat history: always slice to last 6 messages before sending. Older messages are stored in DB but not sent to LLM
- Chunks: retrieve topK=5 from vector search, then trim to topK=3 if total token count exceeds budget
- If a single chunk is too large (>800 tokens), truncate it to first 800 tokens before including
- Token counting: use `tiktoken` or character estimate (1 token ≈ 4 chars) before building final prompt

---

👉 **Added: RAG Safety Strategies**

| Scenario | Handling |
|----------|----------|
| No relevant chunks found (score < threshold) | Skip Research Agent. Return fallback: "I couldn't find relevant information in your documents." |
| Retrieved chunks exceed token limit | Trim chunks from lowest similarity score first until within limit |
| AI call fails (network/timeout) | Retry once after 2s. If still fails, return graceful error message |
| User tries prompt injection ("ignore instructions...") | Input is sanitised — system prompt is always injected before user message and cannot be overridden |

### LLM Strategy

**Primary (Cloud):** AgentRouter API
- `deepseek-v3.1` — orchestration, research, routing, review
- `claude-sonnet-4.6` — final answer generation (Writer Agent only)

**Fallback (Local):** Ollama
- `llama3` — primary local model
- `mistral` — secondary local model

---

## 5. Tech Stack

### Frontend
- React.js (latest)
- Tailwind CSS 4.2

### Backend
- Node.js v20+
- Express.js
- JWT (custom implementation)
- Multer (file uploads)
- 👉 **Added:** `express-rate-limit` — rate limiting middleware
- 👉 **Added:** `dotenv` — all API keys stored in `.env`, never hardcoded
- 👉 **Added:** `tiktoken` (or character-estimate util) — token counting before LLM calls

### Database
- MongoDB with Mongoose ODM
- Redis (response caching)

### AI Layer — Cloud (Primary)
- AgentRouter API
- `deepseek-v3.1`
- `claude-Sonnet-4.6`

### AI Layer — Local (Fallback)
- Ollama
- `llama3`
- `mistral`

### RAG + File Handling
- `pdf-parse` — text extraction
- Custom chunking logic
- Custom embedding service
- In-memory vector store (Phase 1)
- ChromaDB or pgvector (Phase 4 upgrade)

---

## 6. Database Schema (MongoDB)

### Users Collection
```
_id         ObjectId
email       String (unique)
password    String (hashed, bcrypt)
isVerified  Boolean
googleId    String (optional)
createdAt   Date
```

### Documents Collection
```
_id         ObjectId
userId      Ref: Users
workspaceId String
fileName    String
filePath    String
fileSize    Number
fileHash    String (👉 Added: for duplicate detection)
chunks      Array
metadata    Object
status      String (👉 Added: 'processing' | 'ready' | 'failed')
createdAt   Date
```

### Chats Collection
```
_id          ObjectId
userId       Ref: Users
workspaceId  String
title        String
messages[]   Array (embedded)
createdAt    Date
updatedAt    Date (👉 Added: for sorting recent chats)
```

### Messages (embedded in Chats)
```
role         String (user | ai)
content      String
agentUsed    String
sourceChunks Array (👉 Added: [{docId, chunkIndex, excerpt, score}])
timestamp    Date
```

---

## 7. API Design

### Auth Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | — | Register with email |
| POST | `/auth/login` | — | Login, get JWT token |
| POST | `/auth/google` | — | Google OAuth login |
| POST | `/auth/verify-email` | — | Email verification |

### Document Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload` | JWT | Upload PDF — returns `202` immediately, processing runs in background |
| GET | `/documents` | JWT | List user's documents (paginated) |
| GET | `/documents/:id` | JWT | 👉 **Added:** Get document details + chunk metadata |
| GET | `/documents/:id/status` | JWT | 👉 **Added:** Poll processing status — returns `{ status: 'processing' \| 'ready' \| 'failed', progress: 0–100 }` |
| DELETE | `/documents/:id` | JWT | Delete a document |

### Chat + AI Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chat` | JWT | Send message — streams AI response via SSE. See streaming spec below |
| POST | `/analyze` | JWT | Analyze doc, get structured output |
| GET | `/chats` | JWT | Get chat history list (paginated) |
| GET | `/chats/:id` | JWT | Get specific chat with messages |
| GET | `/chats/:id/messages` | JWT | 👉 **Added:** Get messages only (lazy load, cursor-based) |
| DELETE | `/chats/:id` | JWT | 👉 **Added:** Delete a chat |
| PATCH | `/chats/:id` | JWT | 👉 **Added:** Rename a chat |

---

👉 **Added: Chat Streaming Spec (`POST /chat`)**

The `/chat` endpoint uses **Server-Sent Events (SSE)** to stream the AI response token by token.

**Request:**
```json
POST /chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "chatId": "abc123",
  "message": "What is the refund policy?",
  "workspaceId": "ws_001"
}
```

**Response — SSE stream:**
```
Content-Type: text/event-stream

data: {"type": "token", "content": "The"}
data: {"type": "token", "content": " refund"}
data: {"type": "token", "content": " policy"}
data: {"type": "sources", "chunks": [{"docId": "x", "excerpt": "...", "score": 0.91}]}
data: {"type": "done", "messageId": "msg_789"}
data: {"type": "error", "message": "AI failed. Please retry."}
```

**Backend behaviour:**
1. Validate JWT and request body
2. Load last 6 messages from chat history (trim older ones — do not send to LLM)
3. If query needs RAG: embed question → vector search → get topK=5 chunks → trim to fit token budget
4. Build final prompt and call Writer Agent with `stream: true`
5. Pipe tokens to SSE as `{ type: "token", content: "..." }` events
6. After last token, emit `{ type: "sources", chunks: [...] }` then `{ type: "done" }`
7. Save full message + sourceChunks to DB after stream completes
8. On any error mid-stream: emit `{ type: "error", message: "..." }` and close connection

---

👉 **Added: API Standards**

- All endpoints return `{ success: boolean, data: {}, error: string }` shape
- All errors return proper HTTP codes (400, 401, 403, 404, 500)
- Rate limits:
  - Auth endpoints: 10 requests / 15 min per IP
  - `/chat`: 30 requests / min per user
  - `/upload`: 10 uploads / hour per user

👉 **Added: Pagination Response Format**

All list endpoints (`GET /documents`, `GET /chats`, `GET /chats/:id/messages`) return this consistent shape:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 84,
      "page": 2,
      "limit": 20,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": true
    }
  }
}
```

**Query params for all list endpoints:** `?page=1&limit=20`

For `GET /chats/:id/messages` (lazy load), use cursor-based pagination instead:
```json
{
  "data": {
    "items": [...],
    "nextCursor": "msg_abc123",
    "hasMore": true
  }
}
```
Frontend sends `?cursor=msg_abc123&limit=20` to load older messages on scroll-up.

---

## 8. Frontend Pages

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Landing Page | `/` | Public | Hero, features, CTA to signup |
| Login | `/auth/login` | Public | Email login form |
| Signup | `/auth/signup` | Public | Register form |
| Email Verify | `/auth/verify` | Public | Email verification screen |
| Dashboard | `/dashboard` | Protected | Overview — recent chats, doc count, quick actions |
| Chat Page | `/chat` | Protected | Main AI chat interface with streaming + citations |
| Documents Page | `/documents` | Protected | Upload + manage documents (renamed from "Upload Page") |
| Document Viewer | `/documents/:id` | Protected | 👉 **Added:** PDF preview with chunk highlighting |
| Chat History | `/history` | Protected | Sidebar with past chats, rename + delete |
| Settings | `/settings` | Protected | API keys, model config, RAG config, preferences |

---

👉 **Added: Onboarding Flow (First-Time User)**

When a user signs up and visits the dashboard for the first time:

1. Welcome modal: "Let's set up your workspace"
2. Step 1 — Upload your first document (with drag-drop inline)
3. Step 2 — Ask your first question (pre-filled example prompt)
4. Step 3 — See your first AI answer with source citation

This flow is skipped after first document is uploaded. State tracked via `user.onboardingComplete` flag.

---

## 9. Development Phases

### Phase 1 — Backend + AI Core
- Express server setup with folder structure
- PDF upload with Multer + file validation
- Text extraction with `pdf-parse`
- Custom chunking + embedding service
- In-memory vector store
- Multi-agent system wiring (all 6 agents)
- AgentRouter API integration
- `/upload` and `/chat` endpoints working end-to-end
- 👉 **Added:** Basic rate limiting on all endpoints
- 👉 **Added:** Background processing for uploads — `/upload` returns `202` immediately; pipeline runs async
- 👉 **Added:** `GET /documents/:id/status` endpoint for frontend to poll upload progress
- 👉 **Added:** Chat history trimming — send only last 6 messages to LLM
- 👉 **Added:** Token budget check before every LLM call (chunk trimming if over limit)

### Phase 2 — Frontend
- Next.js project setup + Tailwind CSS 4.2 + Shadcn UI
- Landing page
- Chat UI with streaming + citations panel
- Documents page with drag-drop + processing status
- Document Viewer with chunk highlighting
- Connect all frontend pages to backend APIs
- Basic dashboard with empty states and loading states
- 👉 **Added:** Onboarding flow for first-time users

### Phase 3 — Auth + Database
- MongoDB setup with all Mongoose models
- JWT auth — signup, login, middleware
- Email verification flow
- Google OAuth integration
- Chat and message persistence
- Protected route middleware on all endpoints
- 👉 **Added:** Input sanitisation on all user-facing fields

### Phase 4 — Optimization
- Redis caching layer for repeated queries
- ChromaDB or pgvector upgrade for vector store
- Observability — request logs, error tracking, agent debug logs
- Ollama fallback wiring (auto-switch if cloud API fails)
- Performance tuning and code cleanup
- 👉 **Added:** Pagination on documents and chats
- 👉 **Added:** Lazy loading for long chat threads
- 👉 **Added:** Debounce (300ms) on chat input before sending

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| API Response Time | < 3s for cached, < 8s for RAG queries |
| File Upload Size | Max 10MB per PDF |
| File Types Allowed | `.pdf`, `.txt` only |
| Auth Token Expiry | 7 days (JWT) |
| Caching TTL | 1 hour (Redis) |
| Vector Search | Top 5 chunks retrieved, top 3–5 sent to LLM (topK=5, trimmed to budget) |
| Chunk Size | ~500 tokens per chunk, 50 token overlap |
| Max Context Sent to LLM | 6,000 tokens total (system + history + chunks + question) |
| 👉 Chat History Sent to LLM | Last 6 messages only |
| 👉 Single Chunk Max Size | 800 tokens (truncated if larger) |
| 👉 Rate Limit — Chat | 30 requests/min per user |
| 👉 Rate Limit — Upload | 10 uploads/hour per user |
| 👉 Rate Limit — Auth | 10 attempts/15min per IP |
| 👉 Agent Timeout | 15 seconds per agent call |
| 👉 AI Retry on Failure | 1 retry after 2s delay |
| 👉 Upload API Response | `202 Accepted` immediately — processing runs in background |

---

## 11. Security + Best Practices

👉 **Added: Full Section**

| Area | Implementation |
|------|---------------|
| API Keys | Stored in `.env` only. Never exposed in frontend or logs |
| File Validation | Type checked (magic bytes + extension) + size limit before processing |
| JWT | Short-lived tokens (7d), refresh on activity |
| Rate Limiting | Per-endpoint limits via `express-rate-limit` |
| Prompt Injection | System prompt always injected first. User input treated as data, not instructions |
| Password Storage | Bcrypt hashing with salt rounds = 12 |
| Input Sanitisation | All user inputs stripped of HTML/script tags before DB write |
| CORS | Whitelist-only origins in production |
| File Storage | Uploaded files stored outside web root, not directly accessible via URL |

---

## 12. Future Scope (Post v1.0)

- Team workspaces (multiple users, one org)
- Role-based access control (admin, member, viewer)
- CSV and Excel file support
- Slack / Notion integration
- Usage analytics dashboard
- Subscription billing (Stripe)
- API access for developers
- 👉 **Added:** Word document (`.docx`) support
- 👉 **Added:** Chat export as PDF or Markdown
- 👉 **Added:** Usage limits per plan tier (document count, query count)

---

*DataPilotAI — Not just a chatbot. A complete AI-powered SaaS platform with multi-agent RAG architecture.*