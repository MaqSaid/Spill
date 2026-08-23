# Spill — Not Anonymous by Policy. Anonymous by Design.

> A zero-knowledge employee feedback platform where the server is **cryptographically incapable** of reading submissions. Built with Kiro's spec-driven development, 24 steering files, 20 agent hooks, and 4 custom skills.

## The Problem

Traditional feedback tools (Google Forms, SurveyMonkey, Officevibe, Slack bots) all share a fatal flaw: they store plaintext responses, log IP addresses, track sessions, and record timestamps. Employees know this — and self-censor.

**Result:** Organizations get sanitized, useless feedback while real concerns go unspoken.

## The Solution

Spill makes identification **technically impossible** — not just against policy:

| Tool | Plaintext on Server | IP Logging | User Accounts | True Anonymity |
|------|:---:|:---:|:---:|:---:|
| Google Forms | Yes | Yes | Optional | No |
| SurveyMonkey | Yes | Yes | Yes | No |
| Officevibe / Lattice | Yes | Yes | Yes | No |
| Slack anonymous bots | Yes | Yes | Via Slack | No |
| **Spill** | **No** | **No** | **None** | **Yes** |

## Key Features

1. **Zero-Knowledge Encryption** — Feedback encrypted in the browser with AES-256-GCM + RSA-OAEP 4096-bit before network transit. Server stores only ciphertext.
2. **Complete Anonymity** — No accounts, no IP logging, no cookies, no User-Agent. `MetadataPurgingMiddleware` overrides all client IPs to `0.0.0.0`.
3. **MFA Admin Portal** — Token + TOTP two-factor authentication. Private key upload via file picker (never sent to server). Status management with enforced state machine.
4. **Session-Based Status Tracking** — Employees track submission status during their browser session. Ephemeral tokens destroyed on tab close. Impossible to correlate across sessions.
5. **Australian Privacy Act Compliance** — APPs 1-13, Essential Eight Maturity Level 2, Notifiable Data Breaches scheme. Data sovereignty documented.
6. **Hexagonal Architecture** — Core domain has zero framework imports. Clean separation enables comprehensive testing with simple mocks.
7. **Defense in Depth** — Rate limiting, timestamp bucketing (date only), request hardening (64KB limit, content-type enforcement), security headers (CSP, HSTS, X-Frame-Options).

## Architecture

```
┌────────────────────── Browser ──────────────────────┐
│  SubmitPage → EncryptionService → API Client        │
│        ↓                                            │
│  AES-256-GCM + RSA-OAEP (4096-bit)                │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS (ciphertext only)
┌───────────────────────┴─────────────────────────────┐
│  FastAPI + MetadataPurgingMiddleware                │
│  ┌──────────────────────────────────────────────┐   │
│  │ Hexagonal Architecture                       │   │
│  │  Routers → Use Cases → Repository Port       │   │
│  │                             ↓                │   │
│  │              PostgresRepo (SQLAlchemy async)  │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────┘
                        │
                 ┌──────┴──────┐
                 │ PostgreSQL  │
                 └─────────────┘
```

**Backend** (Hexagonal / Ports and Adapters):
- **Core Domain** (`core/`): Entities, use cases, port protocols — zero framework dependencies
- **Driving Adapters** (`adapters/api/`): FastAPI routers, middleware, Pydantic schemas
- **Driven Adapters** (`adapters/db/`): PostgreSQL repository, session store, ULID generator

**Frontend** (React 18 + TypeScript strict):
- **Services**: Encryption (Web Crypto API), session management, API client
- **Pages**: SubmitPage, StatusPage, AdminPage, PrivacyPage, HelpPage
- **Config-driven**: All UI text from centralized `app-config.ts` — zero hardcoded content

## Encryption Flow

```
1. Browser generates random 256-bit AES-GCM key
2. Feedback encrypted with AES-GCM → ciphertext + 12-byte IV
3. AES key wrapped with org's RSA-OAEP 4096-bit public key → wrapped key
4. Server stores: { ciphertext, iv, wrappedKey } (all Base64)
5. Server CANNOT decrypt — only private key holder can
6. Admin imports .pem file in browser → unwraps AES key → decrypts locally
```

## Security Model

| Layer | Protection |
|-------|-----------|
| Content | AES-256-GCM (authenticated encryption) |
| Key Exchange | RSA-OAEP 4096-bit (asymmetric wrapping) |
| Identity | No accounts, no auth tokens, no cookies |
| Network Metadata | MetadataPurgingMiddleware strips all identifying headers |
| Client IP | Overridden to `0.0.0.0` in ASGI scope |
| Timestamps | DATE only (24-hour buckets prevent timing correlation) |
| Session | `sessionStorage` only — cleared on tab close |
| Randomness | `crypto.getRandomValues()` (CSPRNG) |
| Admin Auth | Token (SHA-256 hash) + TOTP (6-digit, 1-step tolerance) |
| Rate Limiting | 10 submissions/hour, 60 status checks/minute, 5 auth attempts/15min |
| Headers | HSTS, CSP, X-Frame-Options DENY, no-referrer, Permissions-Policy |
| Request Hardening | 64KB body limit, JSON content-type enforcement, extra fields rejected |

See [docs/threat-model.md](docs/threat-model.md) for 10 documented attack vectors with mitigations.

## Quick Start (Evaluators)

```bash
git clone <repository-url>
cd Spill
cp backend/.env.example backend/.env
docker-compose up
```

Open `http://localhost:5173` — the app is immediately usable. No accounts, no API keys, no setup needed.

**Test the full flow:**
1. Submit feedback on the employee page (encryption is automatic)
2. Go to `http://localhost:5173/admin`
3. Login with test credentials (see below)
4. Upload `keys/test_private_key.pem` (included in the repo)
5. Click "Click to decrypt" — plaintext appears

### Prerequisites

- Docker & Docker Compose (only requirement for evaluation)
- Node.js 20+ / Python 3.11+ (only for development)

## Usage Instructions

1. **Submit Feedback** (Employee): Open `http://localhost:5173`. Encryption is automatic. Select category + impact, type feedback, click "Encrypt & Submit Anonymously."
2. **Check Status** (Employee): Visit "My Status" tab during the same browser session. Closing the tab permanently ends your session.
3. **Admin Portal** (Manager): Go to `/admin`, authenticate with token + TOTP code, upload private key file (.pem) to decrypt submissions and manage statuses.

## Demo Video

> **For Judges:** See [docs/DemoPitch.md](docs/DemoPitch.md) for a detailed screen-by-screen walkthrough of both Employee and Admin flows, explaining how each screen maps to the competition rubric criteria and what differentiates Spill from existing solutions.

**Demo Video:** [https://youtu.be/IxtZ-jgAjO0](https://youtu.be/IxtZ-jgAjO0)

A demonstration video showing the complete flow:

**Employee Flow (anonymous submission):**
1. Open the app — trust banners visible, encryption auto-configured
2. Select category (Complaint) + impact (Critical), type feedback
3. Click "Encrypt & Submit Anonymously" — encryption indicator animates
4. Confirmation with submission ID shown
5. "My Status" tab — see live status updates from admin

**Admin Flow (MFA + decryption):**
1. Navigate to `/admin` — MFA login gate
2. Enter admin token + 6-digit TOTP code from authenticator app
3. Upload `.pem` private key file via file picker
4. Click "Click to decrypt" — plaintext revealed client-side only
5. Update status → employee sees change in real time

## Test Credentials

**Admin Login (for judges/evaluators):**
- Admin Token: `spill-admin-250c672a0a3885f62c417bc275fce211`
- TOTP Secret (add to Google Authenticator): `MEUYSWEPGOKQYJRUSHNP6NBODBRAVHKZ`
- QR URI: `otpauth://totp/Spill:admin%40spill?secret=MEUYSWEPGOKQYJRUSHNP6NBODBRAVHKZ&issuer=Spill`

**Private Key for Decryption:**
- File: `keys/test_private_key.pem` (included in the repo — committed for judges)
- Upload via file picker in Admin Dashboard after login

**Quick TOTP Code (CLI):**
```bash
python -c "import pyotp; print(pyotp.TOTP('MEUYSWEPGOKQYJRUSHNP6NBODBRAVHKZ').now())"
```

No external API keys, cloud services, or paid accounts needed. Fully self-hosted.

## Running Tests

```bash
# Backend — 55 tests (unit + integration + property-based)
cd backend && python -m pytest -q --tb=short

# Frontend — 22 tests (encryption, session, round-trip)
cd frontend && npx vitest run

# TypeScript strict mode
cd frontend && npx tsc --noEmit

# Python linter
cd backend && ruff check src/

# End-to-end (Playwright)
cd frontend && npx playwright test
```

## Project Structure

```
spill/
├── backend/
│   ├── src/spill/
│   │   ├── core/              # Pure domain (zero framework imports)
│   │   │   ├── entities/      # Submission (frozen dataclass, state machine)
│   │   │   ├── ports/         # Repository Protocol, IdGenerator Protocol
│   │   │   ├── services/      # AdminAuthService (token + TOTP + sessions)
│   │   │   └── use_cases/     # SubmitFeedback, CheckStatus, ManageSubmissions
│   │   ├── adapters/
│   │   │   ├── api/           # FastAPI routers, middleware, security headers
│   │   │   └── db/            # PostgreSQL repository, session store
│   │   └── config/            # Pydantic settings (env-based)
│   ├── tests/                 # Unit, integration, property-based (Hypothesis)
│   ├── alembic/               # Database migrations
│   └── Dockerfile             # Multi-stage, non-root user, healthcheck
├── frontend/
│   ├── src/
│   │   ├── pages/             # SubmitPage, StatusPage, AdminPage, Privacy, Help
│   │   ├── services/          # Encryption (Web Crypto), session, API client
│   │   ├── layouts/           # EmployeeLayout, AdminLayout (skip-to-content, ARIA)
│   │   ├── components/        # EncryptionIndicator, ErrorBoundary
│   │   └── config/            # app-config.ts (all UI text, zero hardcoding)
│   ├── src/test/              # Vitest + Playwright
│   └── Dockerfile             # Multi-stage with dev target
├── scripts/
│   └── rotate-keys.py         # One-command key rotation utility
├── docs/
│   ├── threat-model.md        # 10 attack vectors with mitigations
│   ├── kiro-usage.md          # How Kiro features were used (detailed narrative)
│   ├── project-description.md # Competition submission description
│   ├── canary-deployment-runbook.md
│   ├── incident-response.md   # NDB scheme, 72-hour notification
│   ├── security-posture.md    # DevSecOps pipeline breakdown
│   └── adr/                   # 6 Architecture Decision Records
├── .kiro/
│   ├── specs/                 # requirements.md, design.md, tasks.md (32 tasks)
│   ├── steering/              # 24 steering files
│   ├── hooks/                 # 20 agent hooks
│   └── skills/                # 4 custom skills
└── docker-compose.yml         # Full-stack (PostgreSQL + Backend + Frontend)
```

## Kiro-Powered Development

This project was developed using [Kiro](https://kiro.dev). Full details in [docs/kiro-usage.md](docs/kiro-usage.md).

### Specs (Structured Requirements → Design → Implementation)
- **requirements.md**: 9 functional requirement groups (FR-1 through FR-9), 12 non-functional (NFR-1 through NFR-12)
- **design.md**: Architecture diagrams, component responsibilities, encryption flow, data model
- **tasks.md**: 32 implementation tasks across 5 phases — all complete

### Steering Files (24)
Persistent context that enforces standards on every AI interaction:
- Architecture (hexagonal rules), Security (4 files: core, headers, hardening, admin auth)
- Compliance (Australian Privacy Act), Observability (structured logging, metrics)
- Language standards (Python, TypeScript, React, Docker, Git)
- Domain knowledge, employee trust UX, configurable UI, theming

### Agent Hooks (20)
Automated quality gates on every file save:
- **Security** (6): Secret scanning, post-write crypto verification, header validation, admin auth enforcement, dependency audit
- **Compliance** (3): Privacy Act checks, accessibility (WCAG 2.0), logging safety
- **Code Quality** (4): Python lint (Ruff), frontend lint, auto-test, TypeScript strict
- **Workflow** (7): Commit format, Docker validation, env safety, steering-first reminders, submission readiness

### Custom Skills (4)
Repeatable workflow templates:
- `full-test-suite` — Run all tests + linters in correct order
- `docker-rebuild` — Rebuild and verify Docker stack
- `security-audit` — npm audit + pip-audit + headers + API pen test
- `key-management` — Generate, configure, and rotate RSA key pairs

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy (async), Pydantic v2 |
| Frontend | React 18, TypeScript 5 (strict), Vite, Tailwind CSS |
| Database | PostgreSQL 16 (asyncpg driver) |
| Encryption | Web Crypto API (AES-256-GCM + RSA-OAEP 4096-bit) |
| Auth | SHA-256 token hash + TOTP (pyotp), timing-safe comparison |
| Testing | Pytest + Hypothesis (property-based), Vitest, Playwright |
| Infrastructure | Docker (multi-stage), Docker Compose, Alembic migrations |
| Code Quality | Ruff, Mypy (strict), ESLint, Pre-commit (GitLeaks) |
| Observability | structlog (JSON), Prometheus metrics, X-Request-ID tracing |

## API & Service Costs

**$0 total.** This application is fully self-hosted with zero external dependencies:
- All encryption via Web Crypto API (browser-native, no third-party)
- No cloud services, no SaaS APIs, no payment required
- All dependencies are open source (MIT/BSD/Apache/MPL)
- Runs entirely on `docker-compose up`

## Rate Limits

| Endpoint | Limit | Scope |
|----------|-------|-------|
| Submit feedback | 10/hour | Per session hash |
| Check status | 60/minute | Per session hash |
| Admin auth | 5 attempts/15min | Global (lockout) |
| Admin API | 100/minute | Global |

## Privacy & Compliance

- **Australian Privacy Act 1988** — APPs 1-13 compliance documented
- **Essential Eight** — Maturity Level 2 alignment
- **Notifiable Data Breaches** — 72-hour notification procedure in [docs/incident-response.md](docs/incident-response.md)
- **Data Sovereignty** — Designed for Australian hosting (no cross-border transfer)
- **WCAG 2.0 AA** — Skip-to-content links, ARIA labels, 44px touch targets, semantic HTML

## Attribution

### Backend
FastAPI (MIT), SQLAlchemy (MIT), Pydantic (MIT), Uvicorn (BSD), Alembic (MIT), python-ulid (MIT), asyncpg (Apache 2.0), pyotp (MIT), structlog (MIT), Hypothesis (MPL 2.0), tenacity (Apache 2.0)

### Frontend
React (MIT), React Router (MIT), Vite (MIT), Tailwind CSS (MIT), TypeScript (Apache 2.0)

### Testing
Pytest (MIT), Vitest (MIT), Playwright (Apache 2.0), Ruff (MIT)

### Development
[Kiro](https://kiro.dev) — AI-powered development environment (specs, steering, hooks, skills)

## Team — NullTrace

| Member | Role |
|--------|------|
| **Naveed** | Product Visionary & Strategist |
| **MAQ Said** | Lead Developer & Architect |

### Naveed — Product Visionary & Strategist (STAR)

**Situation:** In Australian workplaces, employees routinely self-censor feedback because existing tools offer anonymity by policy — not by design. The gap between "we promise not to look" and "we technically cannot look" represented an untapped opportunity to build genuine trust between employers and their workforce.

**Task:** Identify a meaningful problem, define a product vision that differentiates from every existing solution, and direct the UX and positioning to resonate with modern employees who are skeptical of corporate promises.

**Action:**
- Identified the core insight: employees don't trust anonymous surveys because they know the server stores plaintext and logs metadata. Framed the entire product around making identification technically impossible rather than just against policy.
- Defined user personas: Gen Z employees who won't engage with tools that feel surveillance-adjacent, and non-technical HR administrators who need simplicity over crypto complexity.
- Directed the trust-first UX approach: banners before forms, plain language over jargon, employment protection notices referencing Australian law, and a confirmation modal that reinforces the privacy guarantee at the moment of maximum anxiety.
- Coined the positioning: "Not anonymous by policy. Anonymous by design." — a single line that captures the entire differentiator.
- Specified the file-picker-only approach for admin key upload (no paste, no textarea) after identifying that HR staff find PEM text intimidating.
- Drove the Australian Privacy Act compliance angle (APPs 1-13, Essential Eight, NDB scheme) as both a legal requirement and a competitive moat.
- Structured the demo narrative using the STAR method, ensuring every screen shown to judges maps directly to a rubric criterion.

**Result:** A product vision that clearly differentiates from Google Forms, SurveyMonkey, Officevibe, and every Slack bot on the market. A competitive comparison table that proves no existing tool offers true zero-knowledge guarantees. A user experience that treats employee vulnerability with respect rather than dismissing it with a checkbox.

**Reflection:** The most impactful decision was insisting that the system should be anonymous by mathematics, not by access control. This single constraint shaped every technical decision downstream — from client-side encryption to metadata purging to timestamp bucketing.

---

### MAQ Said — Lead Developer & Architect (STAR)

**Situation:** Tasked with transforming a product vision into a fully functional, production-grade, zero-knowledge encrypted platform — from empty repository to 72/72 readiness score — using Kiro IDE as the primary development environment.

**Task:** Design and implement a complete full-stack application covering: client-side encryption (AES-256-GCM + RSA-OAEP 4096-bit), hexagonal backend architecture, MFA admin portal, PostgreSQL persistence, Docker infrastructure, 77 automated tests, Australian privacy compliance, WCAG 2.0 accessibility, and comprehensive Kiro configuration (specs, steering, hooks, skills).

**Action:**
- **Architecture & Design:** Established hexagonal architecture with strict layer separation — core domain has zero framework imports, enforced via Kiro steering files. Created 6 Architecture Decision Records documenting key choices (encryption standards, timestamp bucketing, session storage, ULID IDs). Designed a 12-layer security model covering content encryption, key exchange, identity elimination, network metadata purging, timestamp bucketing, session management, admin auth, rate limiting, security headers, request hardening, observability, and compliance.
- **Backend (Python/FastAPI):** Built fully async API using FastAPI + SQLAlchemy + asyncpg. Implemented MetadataPurgingMiddleware (strips IP, User-Agent, X-Forwarded-For, CF-Connecting-IP from every request). Added rate limiting (10 submissions/hour, 60 status checks/minute, 5 auth attempts/15min lockout). Built request hardening (64KB body limit, content-type enforcement, extra field rejection via Pydantic `extra="forbid"`). Applied all security headers (CSP, HSTS, X-Frame-Options DENY, no-referrer, Permissions-Policy, no-cache). Configured structured logging with structlog (JSON in production, never logs encrypted content or tokens). Implemented AdminAuthService with SHA-256 timing-safe token comparison, TOTP MFA with 1-step tolerance, 5-attempt lockout with 15-minute cooldown, 8-hour session TTL, 30-minute idle timeout, and PostgreSQL session persistence.
- **Frontend (React 18/TypeScript strict):** Implemented Web Crypto API encryption service (AES-256-GCM + RSA-OAEP 4096-bit). Built ephemeral session tokens (128-bit random, sessionStorage only, SHA-256 receipt hash). Created real-time encryption indicator. Designed file-picker private key upload with 5 validations. Built config-driven UI (zero hardcoded text). Added error boundaries, lazy-loaded admin bundle, mobile-first responsive design with 44px touch targets, dark mode, and skip-to-content links.
- **Security:** Documented 10-vector threat model. Configured MFA credentials. Built RSA-4096 key rotation script. Implemented emergency lockdown. Verified all security headers via automated tests. Ran npm audit + pip-audit. Proved zero-knowledge guarantee: server provably cannot decrypt.
- **Testing:** 55 backend tests (Pytest unit + integration + Hypothesis property-based). 22 frontend tests (Vitest encryption round-trip + session). Playwright E2E skeleton. 100% pass rate, zero flaky tests.
- **Kiro Configuration:** Spec-driven workflow (requirements → design → 32 tasks). 24 steering files. 20 agent hooks. 4 custom skills. Every security and architecture rule automatically enforced on every AI interaction and file save.
- **Infrastructure:** Multi-stage Docker (non-root, healthchecks). Docker Compose (boots in 30s). Alembic migrations (3 revisions). CI/CD (GitHub Actions). Pre-commit (GitLeaks, Ruff, Mypy).
- **Documentation:** README, threat model, deployment runbook, incident response, security posture, demo pitch (STAR), Kiro usage narrative, 6 ADRs.

**Result:** 72/72 readiness (100%). 77 tests passing. Zero vulnerabilities. Security headers verified. MFA working end-to-end. Docker boots in 30 seconds. $0 cost — fully self-hosted, all open source.

**Reflection:** Kiro's steering files proved to be the highest-leverage feature — they prevented the AI from ever generating code that violated zero-knowledge principles. The 20 hooks created an automated safety net catching privacy violations before commit. The spec-driven workflow eliminated scope creep by tracing every feature to a documented requirement.

## License

Developed for the Kiro competition evaluation.


## How Kiro Was Used — Meaningful Impact

Spill was built entirely within Kiro IDE using its full feature set — not as an afterthought, but as the core development methodology. Kiro wasn't just a code assistant; it was the enforcer of security, architecture, and compliance standards throughout the entire development lifecycle.

### Spec-Driven Development
We used Kiro's Specs workflow to structure the project from requirements (9 functional + 12 non-functional requirement groups) → design (architecture diagrams, encryption flow, data model) → implementation tasks (32 tasks across 5 phases). Every feature traces to a documented requirement. This eliminated scope creep and gave us a clear definition of done.

### 24 Steering Files — Automated Guardrails
These are the most impactful Kiro feature we used. Steering files act as persistent "rules" that influence every AI interaction. For a zero-knowledge platform, this was critical — our `security.md` steering file made it impossible for Kiro to generate code that logs plaintext feedback, uses localStorage, or puts framework imports in the core domain. The `architecture.md` file enforced hexagonal layer separation on every code generation. `compliance-australian.md` ensured Privacy Act alignment. These aren't suggestions — they're automated guardrails that prevent security violations at the point of code generation.

### 20 Agent Hooks — Shift-Left Security
Hooks run automatically on every file save and tool use. Our `security-review-post-write` hook verified zero-knowledge compliance after every write operation. `validate-no-secrets` blocked any file containing hardcoded credentials. `accessibility-check` validated WCAG 2.0 on layout changes. `dep-vuln-check` prompted vulnerability scans when dependencies changed. These hooks caught 3 potential privacy violations during development before they could be committed.

### 4 Custom Skills — Repeatable Workflows
We created reusable workflow skills for operations we repeated frequently — running the full test suite (77 tests in correct order), rebuilding Docker, running security audits (npm audit + pip-audit + header checks + API pen testing), and managing RSA key pairs. Skills turned multi-step procedures into consistent one-command workflows.

### Sub-agents
Used `context-gatherer` for deep codebase exploration before making changes, and `semantic_reviewer` for design-level code review.

### Why This Matters — What Kiro Prevented

The meaningful impact of Kiro usage is best demonstrated by what it PREVENTED, not just what it built:

1. **Security steering prevented 3 privacy violations** — During development, the AI attempted to add debug logging that would have printed encrypted payload content. The `security.md` steering file caught this at generation time. Without it, we'd have shipped a zero-knowledge platform that leaked data in logs.

2. **Architecture steering maintained hexagonal purity** — On 4 occasions, generated code tried to import FastAPI directly into the core domain layer. The `architecture.md` steering file blocked this automatically, maintaining the clean port/adapter separation that makes the core testable without infrastructure.

3. **Hooks created shift-left security** — The post-write security hook runs on EVERY file save. It verified no localStorage usage, no plaintext logging, and correct encryption standards continuously. This is more reliable than manual code review for a security-critical application.

4. **Specs eliminated rework** — The 32-task breakdown meant we never had to re-architect. Requirements were locked before implementation began. Design decisions were documented in 6 ADRs before code was written. Result: zero major refactors during the entire build.

5. **Skills made quality repeatable** — Running 77 tests across 4 different tools (pytest, vitest, tsc, ruff) in the correct order with correct flags is error-prone manually. The `full-test-suite` skill made this a single consistent operation.

**The bottom line:** Kiro's value wasn't just speed — it was CORRECTNESS. For a zero-knowledge platform where a single logging statement can break the privacy guarantee, having automated enforcement at the generation, save, and commit layers is the difference between "probably secure" and "provably secure."
