# DataPilotAI — Product Requirements Document
**Version:** 1.0 | **Industry:** AI SaaS Tools | **Stack:** MERN + AI Layer | **Phases:** 4

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
- Gives accurate, context-grounded answers
- Reduces repetitive internal questions
- Helps complete tasks faster with actionable outputs

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

### 2.3 Multi-Agent AI System
- Orchestrator routes to correct sub-agent based on query type
- Research Agent handles RAG retrieval
- Chat Agent handles general conversation
- Action Agent generates structured outputs
- Reviewer Agent fact-checks answers
- Writer Agent formats final response

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

### 2.7 Workspaces Structure
- Each user has an isolated workspace
- Upload docs, manage chats, all scoped to workspace context
- Scalable for future team/organization-level workspaces

### 2.8 Observability + Logging
- Request logging on all API endpoints
- Error tracking with stack traces
- Agent flow debug logs for production health monitoring

---

## 3. System Architecture

```
Frontend (Next.js + Tailwind + Shadcn)
        ↓ HTTP / REST
Backend API (Express.js) + JWT Auth Middleware
        ↓
Orchestrator Agent
        ↓
Research Agent / Chat Agent / Action Agent
        ↓
Reviewer Agent → Writer Agent
        ↓
RAG Pipeline (chunks + embeddings)  +  LLM (AgentRouter / Ollama fallback)
        ↓
MongoDB + Redis Cache
```

### RAG Document Pipeline

```
Upload PDF → Multer → pdf-parse → Chunking Service → Embedding Service → Vector Store → Stored Knowledge Base
```

### Query Flow (RAG + AI)

```
User Question → Embedding (question) → Vector Search → Top Relevant Chunks → Context Build → AI Agents Process → Final Answer
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

### LLM Strategy

**Primary (Cloud):** AgentRouter API
- `deepseek-v3.1` — orchestration, research, routing, review
- `claude-opus-4-6` — final answer generation (Writer Agent only)

**Fallback (Local):** Ollama
- `llama3` — primary local model
- `mistral` — secondary local model

---

## 5. Tech Stack

### Frontend
- Next.js (latest)
- Tailwind CSS 4.2
- Shadcn UI

### Backend
- Node.js v20+
- Express.js
- JWT (custom implementation)
- Multer (file uploads)

### Database
- MongoDB with Mongoose ODM
- Redis (response caching)

### AI Layer — Cloud (Primary)
- AgentRouter API
- `deepseek-v3.1`
- `claude-opus-4-6`

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
password    String (hashed)
isVerified  Boolean
googleId    String (optional)
createdAt   Date
```

### Documents Collection
```
_id         ObjectId
userId      Ref: Users
fileName    String
filePath    String
chunks      Array
metadata    Object
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
```

### Messages (embedded in Chats)
```
role         String (user | ai)
content      String
agentUsed    String
sourceChunks Array
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
| POST | `/upload` | JWT | Upload PDF document |
| GET | `/documents` | JWT | List user's documents |
| DELETE | `/documents/:id` | JWT | Delete a document |

### Chat + AI Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chat` | JWT | Send message, get AI response |
| POST | `/analyze` | JWT | Analyze doc, get structured output |
| GET | `/chats` | JWT | Get chat history list |
| GET | `/chats/:id` | JWT | Get specific chat messages |

---

## 8. Frontend Pages

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Landing Page | `/` | Public | Hero, features, CTA to signup |
| Login | `/auth/login` | Public | Email login form |
| Signup | `/auth/signup` | Public | Register form |
| Email Verify | `/auth/verify` | Public | Email verification screen |
| Dashboard | `/dashboard` | Protected | Overview — recent chats, doc count, quick actions |
| Chat Page | `/chat` | Protected | Main AI chat interface (ChatGPT-like) |
| Upload Page | `/upload` | Protected | Drag-drop or click PDF upload with processing status |
| Documents Page | `/documents` | Protected | List of uploaded docs — preview, delete, metadata |
| Chat History | `/history` | Protected | Sidebar with past chats, click to restore |
| Settings | `/settings` | Protected | Profile, password, workspace settings |

---

## 9. Development Phases

### Phase 1 — Backend + AI Core
- Express server setup with folder structure
- PDF upload with Multer
- Text extraction with `pdf-parse`
- Custom chunking + embedding service
- In-memory vector store
- Multi-agent system wiring (all 6 agents)
- AgentRouter API integration
- `/upload` and `/chat` endpoints working end-to-end

### Phase 2 — Frontend
- Next.js project setup + Tailwind CSS 4.2 + Shadcn UI
- Landing page
- Chat UI (ChatGPT-like interface)
- Upload page with drag-drop + processing status
- Documents listing page
- Connect all frontend pages to backend APIs
- Basic dashboard

### Phase 3 — Auth + Database
- MongoDB setup with all Mongoose models
- JWT auth — signup, login, middleware
- Email verification flow
- Google OAuth integration
- Chat and message persistence
- Protected route middleware on all endpoints

### Phase 4 — Optimization
- Redis caching layer for repeated queries
- ChromaDB or pgvector upgrade for vector store
- Observability — request logs, error tracking, agent debug logs
- Ollama fallback wiring (auto-switch if cloud API fails)
- Performance tuning and code cleanup

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| API Response Time | < 3s for cached, < 8s for RAG queries |
| File Upload Size | Max 10MB per PDF |
| Auth Token Expiry | 7 days (JWT) |
| Caching TTL | 1 hour (Redis) |
| Vector Search | Top 5 chunks per query |
| Chunk Size | ~500 tokens per chunk, 50 token overlap |

---

## 11. Future Scope (Post v1.0)

- Team workspaces (multiple users, one org)
- Role-based access control (admin, member, viewer)
- CSV and Excel file support
- Slack / Notion integration
- Usage analytics dashboard
- Subscription billing (Stripe)
- API access for developers

---

*DataPilotAI — Not just a chatbot. A complete AI-powered SaaS platform with multi-agent RAG architecture.*
