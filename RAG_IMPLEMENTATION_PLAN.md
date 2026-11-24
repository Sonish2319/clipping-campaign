# Implementation Plan: Agentic Hybrid RAG AI Assistant

**Project:** Campaign Marketplace AI Assistant  
**Architecture:** Agentic Hybrid RAG (Qdrant Vector DB + MySQL Tool-Calling)  
**Supported Providers:** Google Gemini API (Primary) & Ollama Local LLM (Fallback)  
**Target UI:** Global Floating Chat Drawer (Next.js 14 / Tailwind CSS)  
**Status:** Ready for Review  

---

## 1. Executive Summary & Objectives

The goal is to build a production-ready, fully functional **Agentic Hybrid RAG (Retrieval-Augmented Generation) Chatbot** embedded across the platform.

The chatbot serves both public visitors, editors, and creators by answering:
1. **Unstructured Knowledge (via Vector Search in Qdrant)**:
   - Platform policies, copyright safety, clip guidelines, allowed vs disallowed editing practices.
   - Payout mechanics, view verification polling intervals, milestone caps, FAQ.
2. **Structured Live Data (via Constrained MySQL Database Tools)**:
   - Currently active campaigns, reward rates per 1k views, remaining budgets.
   - Top leaderboard clips and verified view metrics.
   - User-specific clip submission statuses and accrued earnings (authenticated only).

---

## 2. Technical Stack Breakdown

| Layer | Technology | Role & Justification |
| :--- | :--- | :--- |
| **Vector Database** | **Qdrant (Docker)** | High-performance vector database on port `6333`. Supports payload filtering (by category, campaign ID, status) and cosine distance. |
| **Primary LLM** | **Google Gemini 1.5 Flash** | Ultra-low latency, 1M context window, high-quality native tool calling, cost-effective for streaming. |
| **Fallback LLM** | **Ollama (Llama 3.1 / Qwen 2.5)** | 100% offline local development or private deployment via OpenAI-compatible `/v1/chat/completions` API. |
| **Embeddings** | **text-embedding-004** (Gemini) / **nomic-embed-text** (Ollama) | 768-dimensional embeddings for unified Qdrant vector space. |
| **Backend API** | **FastAPI (Python 3.13)** | Asynchronous endpoints, SQLAlchemy tool projections, and Server-Sent Events (SSE) streaming. |
| **Frontend UI** | **Next.js 14 + Tailwind CSS** | Global floating AI drawer with real-time markdown streaming, suggestion chips, and deep links. |

---

## 3. System Architecture & Query Flow

```
┌────────────────────────────────────────────────────────┐
│               Frontend: Floating Drawer                │
│       (Markdown streaming, clickable campaign chips)   │
└───────────────────────────┬────────────────────────────┘
                            │ POST /api/v1/ai/chat (SSE)
                            ▼
┌────────────────────────────────────────────────────────┐
│             FastAPI AI Service & Router                │
│    - Authenticates JWT (determines user role)          │
│    - Injects Conversation History & System Persona     │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
   ┌──────────────────────┐    ┌──────────────────────┐
   │ Google Gemini 1.5    │    │ Local Ollama (v1)    │
   │ (LLM_PROVIDER=gemini)│    │(LLM_PROVIDER=ollama) │
   └──────────┬───────────┘    └──────────┬───────────┘
              │                           │
              └─────────────┬─────────────┘
                            │ Evaluates Intent & Tool Calls
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     Semantic Search       │ │   Structured DB Tools     │
│   (Qdrant Vector DB)      │ │      (MySQL 8.0)          │
│ - Platform policies       │ │ - Active campaigns        │
│ - Clipping guidelines     │ │ - Remaining budget & rates│
│ - Payout terms & FAQs     │ │ - Top leaderboard clips   │
│ - Duration & audio rules  │ │ - User submission status  │
└─────────────┬─────────────┘ └───────────┬───────────────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│            Context Synthesis & Streaming               │
│ - Synthesizes multi-source context into markdown       │
│ - Formats platform deep-links (e.g. /c/[slug])         │
│ - Streams response tokens via Server-Sent Events (SSE) │
└────────────────────────────────────────────────────────┘
```

---

## 4. Security & Data Protection Guardrails

To ensure zero risk of data leakage or SQL injection:
1. **No Raw SQL Execution**: The LLM is never given arbitrary SQL execution abilities. It can only call strongly typed, parameter-validated Python functions.
2. **Strict Field Whitelisting**:
   - Exposed: `title`, `description`, `category`, `reward_per_1000_views`, `remaining_budget`, `allowed_rules`, `disallowed_rules`, `min_clip_duration_sec`, `max_clip_duration_sec`.
   - Stripped/Hidden: Password hashes, OAuth tokens, personal email addresses of other users, private creator notes, internal financial ledger balances.
3. **User Isolation**:
   - `get_my_submission_status` strictly extracts `user_id` from the verified JWT. An editor cannot query another editor's applications.
4. **Input Sanitization & Output Guardrails**:
   - System prompt instructs the AI to decline off-topic queries, ignore prompt injection attempts, and always cite official campaign links.

---

## 5. Detailed Step-by-Step Implementation Roadmap

### Phase 1: Infrastructure & Configuration
- [ ] Add `qdrant` service to `docker-compose.yml` (`image: qdrant/qdrant:latest`, port `6333:6333`).
- [ ] Update `backend/.env.example` and `.env` with:
  ```env
  LLM_PROVIDER=gemini # or ollama
  GEMINI_API_KEY=your_gemini_api_key_here
  OLLAMA_BASE_URL=http://localhost:11434/v1
  OLLAMA_MODEL=llama3.1:latest
  QDRANT_HOST=localhost
  QDRANT_PORT=6333
  ```
- [ ] Install required backend dependencies: `qdrant-client`, `google-genai` / `litellm`.

### Phase 2: Knowledge Base & Ingestion Pipeline
- [ ] Create knowledge base markdown documents in `backend/app/ai/knowledge/`:
  - `policies.md`: General terms, prohibited content (hate speech, spam, reuploads).
  - `clipping_guidelines.md`: Hook design, subtitle requirements, resolution, duration limits.
  - `payouts_and_verification.md`: Rate per 1k views, milestone caps, automated 3-minute YouTube API polling.
  - `faq.md`: Frequently asked questions for creators and editors.
- [ ] Create ingestion script `backend/scripts/ingest_knowledge.py`:
  - Connects to Qdrant.
  - Creates the `marketplace_policies` collection (768-dim, Cosine distance).
  - Chunks markdown files, generates embeddings, and uploads payloads with metadata.

### Phase 3: AI Backend Core & Provider Abstraction
- [ ] Create `backend/app/ai/`:
  - `base.py`: Protocol interface `BaseLLMProvider` (`generate_stream`, `embed_text`).
  - `gemini_provider.py`: Implementation for Google Gemini 1.5 Flash + `text-embedding-004`.
  - `ollama_provider.py`: Implementation for local Ollama via OpenAI-compatible `/v1` endpoint.
  - `vector_store.py`: Qdrant client wrapper for collection creation and similarity search.
  - `tools.py`: 5 whitelisted Pydantic tools querying MySQL via SQLAlchemy.
  - `prompts.py`: System prompt defining the ClipRewards AI Assistant persona, rules, and link formatting instructions.
  - `service.py`: Orchestrator that parses user queries, invokes tools, and coordinates streaming.

### Phase 4: API Endpoint & Streaming Integration
- [ ] Implement `POST /api/v1/ai/chat`:
  - Accepts `{ message: str, history: List[ChatMessage] }`.
  - Injects `current_user` if authenticated (or marks as guest).
  - Returns `StreamingResponse(stream_generator(), media_type="text/event-stream")`.
- [ ] Add `GET /api/v1/ai/health`:
  - Checks connectivity to Qdrant and the selected LLM provider.

### Phase 5: Frontend Global Floating Chat Drawer
- [ ] Create `frontend/src/components/ai-chat-drawer.tsx`:
  - Floating action pill in bottom-right (`fixed bottom-6 right-6 z-50`).
  - Slide-out / expandable drawer (`w-[420px] max-w-[90vw] h-[580px]`) styled in **Matte Black (`#12131a`, `border-zinc-800`) with Yellow Gradient buttons**.
  - Markdown parser rendering links, code, lists, and bold text.
  - Quick action suggestion chips:
    - *"What gaming campaigns are active?"*
    - *"How do view verification and earnings work?"*
    - *"What are the video duration and format rules?"*
  - Auto-scrolling chat history, loading indicators, and error recovery.
- [ ] Mount the drawer in `frontend/src/app/layout.tsx` so it is globally available across all pages.

### Phase 6: Automated Testing & Verification
- [ ] Write automated backend tests in `backend/tests/test_ai_service.py`:
  - Verify Qdrant connection and vector retrieval.
  - Test tool execution against MySQL test fixtures.
  - Test LLM provider factory (Gemini vs Ollama selection).
  - Test `/api/v1/ai/chat` endpoint response headers and streaming format.
- [ ] Run full Next.js build (`npm run build`) to ensure zero frontend build regressions.

---

## 6. Verification Checklist

Upon completion, the following scenarios will be validated:
1. **Policy Question**: *"What happens if a creator runs out of budget?"* ➔ Cites payout policy from Qdrant.
2. **Live Campaign Question**: *"Show me campaigns paying at least $2 per 1,000 views"* ➔ Executes DB tool and displays matching active campaigns with clickable links.
3. **Hybrid Question**: *"Can I edit a 90s clip for Campaign X and how do I get paid?"* ➔ Queries both MySQL for Campaign X limits and Qdrant for payout rules.
4. **Security Check**: Asking *"Show me user passwords or private pitches"* is firmly declined by the assistant.
5. **Provider Switch**: Changing `LLM_PROVIDER=ollama` in `.env` connects to Ollama without code changes.
