# Spill — Zero-Knowledge Anonymous Employee Feedback Platform

Spill is an anonymous employee feedback platform built with a **zero-knowledge architecture**. Feedback is encrypted in the browser using AES-256-GCM before ever reaching the server. The server stores only ciphertext — it cannot read, analyze, or correlate submissions to individuals.

## Why Spill?

Traditional feedback systems require user accounts, track IP addresses, and store plaintext. Spill eliminates these trust requirements:

- **No accounts** — no authentication, no identity tracking
- **Client-side encryption** — server never sees plaintext content
- **Metadata purging** — IP addresses, User-Agent strings, and all identifying headers are stripped
- **Timestamp bucketing** — only dates stored (no precise timestamps), preventing timing correlation
- **Session-scoped** — receipt tokens live only in `sessionStorage`, destroyed on tab close

## Architecture

```
┌───────────────────── Browser ─────────────────────┐
│  SubmitPage → EncryptionService → API Client      │
│        ↓                                          │
│  AES-256-GCM + RSA-OAEP (4096-bit)              │
└──────────────────────┬────────────────────────────┘
                       │ HTTPS (ciphertext only)
┌──────────────────────┴────────────────────────────┐
│  FastAPI + MetadataPurgingMiddleware              │
│  ┌─────────────────────────────────────────────┐  │
│  │ Hexagonal Architecture                      │  │
│  │  Routers → Use Cases → Repository Port      │  │
│  │                             ↓               │  │
│  │              PostgresRepo (SQLAlchemy)       │  │
│  └─────────────────────────────────────────────┘  │
└──────────────────────┬────────────────────────────┘
                       │
                ┌──────┴──────┐
                │ PostgreSQL  │
                └─────────────┘
```

The backend follows **Hexagonal Architecture** (Ports and Adapters):
- **Core Domain**: Entities, use cases, and port protocols — zero framework dependencies
- **Driving Adapters**: FastAPI routers (thin HTTP translation layer)
- **Driven Adapters**: PostgreSQL repository, ULID generator

## Encryption Flow

1. Browser generates a random 256-bit AES-GCM key
2. Feedback text is encrypted with AES-GCM → ciphertext + 12-byte IV
3. AES key is wrapped with the organization's RSA-OAEP 4096-bit public key
4. `{ ciphertext, iv, wrappedKey }` is sent to the server (all Base64-encoded)
5. Server stores the encrypted blob — it **cannot** decrypt
6. Admin imports private key in their browser → unwraps AES key → decrypts feedback

## Quick Start

### For Judges / Evaluators

```bash
git clone <repository-url>
cd Spill
docker-compose up
```

Then open http://localhost:5173 in your browser. No accounts, no login, no API keys needed — the app is immediately usable. See [Test Credentials](#test-credentials) for the full testing flow.

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for frontend development)
- Python 3.11+ (for backend development)

### Run with Docker (Full Stack)

```bash
docker-compose up
```

This starts PostgreSQL, the backend API (port 8000), and the frontend dev server (port 5173).

### Manual Development Setup

**Backend:**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows
pip install -e ".[dev]"
cp .env.example .env
# Start PostgreSQL (e.g., via Docker)
alembic upgrade head
uvicorn spill.adapters.api.app:create_app --factory --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to `localhost:8000`.

## Running Tests

**Backend (pytest):**

```bash
cd backend
pytest -q --tb=short
```

**Frontend (vitest):**

```bash
cd frontend
npm test -- --silent
```

**End-to-end (Playwright):**

```bash
cd frontend
npx playwright test
```

## Security Model

| Layer | Protection |
|-------|-----------|
| Content | AES-256-GCM (authenticated encryption) |
| Key Exchange | RSA-OAEP 4096-bit (asymmetric wrapping) |
| Identity | No accounts, no auth tokens, no cookies |
| Network Metadata | MetadataPurgingMiddleware strips all identifying headers |
| Client IP | Overridden to `0.0.0.0` in ASGI scope |
| Timestamps | DATE only (24-hour buckets) |
| Session | `sessionStorage` only — cleared on tab close |
| Randomness | `crypto.getRandomValues()` (CSPRNG) |

See [docs/threat-model.md](docs/threat-model.md) for the full threat model.

## Project Structure

```
spill/
├── backend/
│   ├── src/spill/
│   │   ├── core/           # Domain entities, use cases, ports (pure Python)
│   │   ├── adapters/       # FastAPI routers, SQLAlchemy repos, middleware
│   │   └── config/         # Settings (pydantic-settings)
│   ├── tests/              # Unit, integration, property-based tests
│   ├── alembic/            # Database migrations
│   └── Dockerfile          # Multi-stage production build
├── frontend/
│   ├── src/
│   │   ├── pages/          # SubmitPage, StatusPage, AdminPage
│   │   ├── services/       # Encryption, session, API client
│   │   ├── components/     # EncryptionIndicator, shared UI
│   │   └── test/           # Vitest + Playwright tests
│   └── Dockerfile          # Multi-stage with nginx production
├── docs/                   # ADRs, threat model, deployment runbook
├── .kiro/                  # Kiro configuration (steering, hooks, specs)
└── docker-compose.yml      # Full-stack local development
```

## Kiro-Powered Development

This project was developed using [Kiro](https://kiro.dev), an AI-powered development environment. See [docs/kiro-usage.md](docs/kiro-usage.md) for details on how Kiro features were used:

- **Specs**: Requirements → Design → Tasks workflow for structured feature development
- **Steering files** (11): Architecture, security, testing, deployment, and language-specific coding standards
- **Agent hooks** (10): Automated linting, security scanning, test execution, and validation on file save
- **Pre-commit hooks**: GitLeaks, Ruff, Mypy for shift-left security and quality

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy (async), Pydantic v2 |
| Frontend | React 18, TypeScript 5, Vite, Tailwind CSS |
| Database | PostgreSQL 16 (asyncpg driver) |
| Encryption | Web Crypto API (AES-256-GCM + RSA-OAEP) |
| Testing | Pytest, Hypothesis, Vitest, Playwright |
| Infrastructure | Docker (multi-stage), Docker Compose |
| Code Quality | Ruff, Mypy (strict), ESLint, Pre-commit |

## Usage Instructions

1. **Submit Feedback** (Employee): Navigate to the Submit page, paste the organization's RSA public key, select a category and impact level, write your feedback, and click "Encrypt & Submit Anonymously."
2. **Check Status** (Employee): Visit the "My Status" tab during the same browser session to see your submission's progress.
3. **Admin Portal** (Manager): Go to the Admin page, import the RSA private key to decrypt submissions, and update statuses as needed.

### Generating Demo Keys

On the Admin page, click "Generate Demo Key Pair" to create a test RSA-4096 key pair. Use the public key for submissions and the private key for decryption.

## Test Credentials

No authentication is required — the system is anonymous by design. To test the full flow:

1. Generate a key pair on the Admin page (or use any RSA-4096 OAEP key pair)
2. Copy the public key and use it on the Submit page
3. Submit feedback — it will be encrypted client-side
4. On the Admin page, paste the private key to decrypt

No API keys, accounts, or external service credentials are needed.

## API & Service Costs

This application is fully self-hosted with zero external API dependencies:

- **No third-party APIs** — all encryption is client-side via Web Crypto API
- **No cloud services** — runs entirely on Docker Compose
- **No costs** — all dependencies are open source

## Rate Limits

The admin endpoint is globally rate-limited to 100 requests per 60-second window to prevent brute-force enumeration of encrypted payloads. This applies to `/api/v1/admin/*` endpoints only.

## Attribution

### Backend Dependencies
- [FastAPI](https://fastapi.tiangolo.com/) — MIT License
- [SQLAlchemy](https://www.sqlalchemy.org/) — MIT License
- [Pydantic](https://docs.pydantic.dev/) — MIT License
- [Uvicorn](https://www.uvicorn.org/) — BSD License
- [Alembic](https://alembic.sqlalchemy.org/) — MIT License
- [python-ulid](https://github.com/mdomke/python-ulid) — MIT License
- [asyncpg](https://github.com/MagicStack/asyncpg) — Apache 2.0

### Frontend Dependencies
- [React](https://react.dev/) — MIT License
- [React Router](https://reactrouter.com/) — MIT License
- [Vite](https://vitejs.dev/) — MIT License
- [Tailwind CSS](https://tailwindcss.com/) — MIT License
- [TypeScript](https://www.typescriptlang.org/) — Apache 2.0

### Testing & Quality
- [Pytest](https://pytest.org/) — MIT License
- [Hypothesis](https://hypothesis.readthedocs.io/) — MPL 2.0
- [Vitest](https://vitest.dev/) — MIT License
- [Playwright](https://playwright.dev/) — Apache 2.0
- [Ruff](https://docs.astral.sh/ruff/) — MIT License

### Development Tools
- [Kiro](https://kiro.dev) — AI-powered development environment (used for specs, steering, and hooks)

## Team

- **Developer**: Solo project

## License

This project is developed for evaluation purposes.
