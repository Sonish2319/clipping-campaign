# ClipRewards — YouTube Creator Campaign & Clip Marketplace (MVP)

A production-grade MVP for a YouTube Creator Campaign Marketplace inspired by [ContentRewards](https://contentrewards.com/c/discover). 

The platform connects **YouTube Creators** funding viral clip campaigns with **Video Editors** who discover campaigns, craft YouTube Shorts, publish them to their channels, link their videos, and receive automated performance rewards ($/1,000 views) verified through official Google YouTube Data APIs.

---

## 1. Key Features & Modules

- **Public Marketplace Discovery (`/c/discover`)**:
  - Filter by Category (Gaming, Tech, Entertainment, Education)
  - Search by keyword or creator
  - Sort by Highest Reward, Highest Budget, Most Popular, Newest
  - ContentRewards-inspired campaign cards with budget progress bars, reward rates ($/1,000 views), editor caps, and deadline indicators.
- **Creator Studio (`/creator/*`)**:
  - Launch campaigns with duration limits, rules, and YouTube long-form video links
  - Review editor pitches (Accept / Reject)
  - Review submitted YouTube clips (Approve / Reject)
  - Performance analytics with Recharts views growth timeseries and spending metrics.
- **Editor Hub (`/editor/*`)**:
  - Apply to active campaigns with pitch & portfolio strategy
  - Link YouTube channel (ownership verification)
  - Submit published YouTube Short / Video URLs with automatic metadata fetching
  - Track clip views, likes, and rewards in real time
  - Simulated wallet balance & immutable transaction ledger.
- **Superadmin Control Center (`/admin/*`)**:
  - Platform KPIs (total users, active campaigns, platform views, budget funded)
  - Campaign moderation (Approve, Reject, Suspend)
  - Celery background workers monitor
  - Immutable audit trail (`audit_logs`) and authentication logs (`authentication_logs`).
- **Automated YouTube Tracking & Celery Polling**:
  - Batch queries YouTube Data API v3 (`videos.list`) for up to 50 videos per call (1 quota unit)
  - Periodic polling every 1–3 minutes
  - Automatic statistics snapshot recordings and delta calculations
  - Performance rewards calculation with budget caps and immutable ledger entries.

---

## 2. Technology Stack

- **Backend**: Python 3.12+ / 3.13, FastAPI, SQLAlchemy 2.x, PyMySQL, Pydantic v2, Celery, Redis.
- **Database & Cache**: MySQL 8.4 LTS, Redis 7 (Dockerized).
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, shadcn/ui design language, Recharts, Lucide Icons.
- **Security & RBAC**: JWT Bearer authentication, Fernet symmetric token encryption for OAuth refresh tokens at rest, granular permission and role-based access control.
- **Background Engine**: Celery Workers and Celery Beat for batch statistics polling and token lifecycle management.

---

## 3. Seeded Demo Accounts

The database comes pre-seeded with live-like data, campaigns, applications, submissions, and wallets:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Superadmin** | `admin@campaignmarketplace.com` | `AdminSecretPass123!` | Complete platform governance & audit |
| **Creator** | `creator@apexvisuals.com` | `CreatorPass123!` | Apex Visuals Studio (1.2M Subs, 3 campaigns) |
| **Editor** | `alex.editor@viralclips.io` | `EditorPass123!` | Viral Clips Crafter (Submissions & Wallet) |

*(Quick-switch demo login buttons are also available on the `/auth/login` page for instant testing!)*

---

## 4. Quick Start Guide

### Prerequisites
- Docker & Docker Compose installed
- Python 3.12+ (or use Docker)
- Node.js 18+ (or use Docker)

### Option A: Run Everything with Docker Compose

1. Clone or navigate to the repository directory:
   ```bash
   cd "d:\Backend Journey\campaign"
   ```
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Start all containers (MySQL, Redis, Backend, Celery Worker, Celery Beat, Frontend):
   ```bash
   docker compose up -d
   ```
4. Seed initial database and demo campaigns:
   ```bash
   docker compose exec backend python scripts/seed_data.py
   ```
5. Open your browser:
   - **Frontend Marketplace**: `http://localhost:3000`
   - **Discover Campaigns**: `http://localhost:3000/c/discover`
   - **FastAPI Interactive Docs**: `http://localhost:8000/api/docs`

---

### Option B: Local Development with Python `.venv`

1. **Start MySQL & Redis containers**:
   ```bash
   docker compose up -d mysql redis
   ```
2. **Setup Backend Virtual Environment**:
   ```bash
   cd backend
   uv venv .venv
   uv pip install --python .venv/Scripts/python.exe -r requirements.txt
   ```
3. **Run Database Seed**:
   ```bash
   .\.venv\Scripts\python.exe scripts/seed_data.py
   ```
4. **Start FastAPI Backend**:
   ```bash
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
   ```
5. **Start Frontend Next.js**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 5. Google OAuth & YouTube API Setup

To connect live Google authentication and official YouTube Data API:

1. Go to **Google Cloud Console** -> **APIs & Services**.
2. Enable **YouTube Data API v3**.
3. Create an **OAuth 2.0 Client ID** (Web Application):
   - Authorized Javascript Origins: `http://localhost:3000`
   - Authorized Redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/editor/channels/callback`
4. Add credentials to your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   YOUTUBE_API_KEY=AIzaSy...your_youtube_key
   ```
*(Note: If no API key is supplied, the built-in deterministic fallback generator ensures video metadata and polling work seamlessly without crashing!)*

---

## 6. Running Automated Tests

Run the complete test suite:
```bash
cd backend
.\.venv\Scripts\python.exe -m pytest tests/ -v
```
Tests cover:
- Password hashing & verification
- JWT token issuing, expiration, and payload parsing
- Fernet symmetric token encryption & decryption at rest
- YouTube video ID extraction across watch, shorts, and embed URLs
- ISO 8601 duration parsing
- Reward calculation engine & editor budget caps
- FastAPI endpoints (health, root, campaign discovery, admin login)
