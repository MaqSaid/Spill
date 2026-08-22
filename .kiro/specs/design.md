# Spill — Design Document

## Architecture Overview

Spill follows **Hexagonal Architecture** (Ports and Adapters) to maintain strict separation between business logic and infrastructure concerns.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Employee    │  │   Session    │  │    Admin       │ │
│  │  Portal      │  │   Board      │  │    Portal      │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘ │
│         │                  │                   │          │
│  ┌──────┴──────────────────┴───────────────────┴───────┐ │
│  │          Encryption Service (Web Crypto API)         │ │
│  └─────────────────────────┬───────────────────────────┘ │
└────────────────────────────┼─────────────────────────────┘
                             │ HTTPS (encrypted payloads only)
┌────────────────────────────┼─────────────────────────────┐
│              Backend (FastAPI / ASGI)                      │
│  ┌─────────────────────────┼───────────────────────────┐ │
│  │     MetadataPurgingMiddleware (strips IP/UA/headers) │ │
│  └─────────────────────────┼───────────────────────────┘ │
│                            │                              │
│  ┌── Driving Adapters ─────┼───────────────────────────┐ │
│  │  ┌──────────────┐  ┌───┴─────────┐  ┌───────────┐  │ │
│  │  │ Submissions  │  │   Status    │  │   Admin   │  │ │
│  │  │ Router       │  │   Router    │  │   Router  │  │ │
│  │  └──────┬───────┘  └──────┬──────┘  └─────┬─────┘  │ │
│  └─────────┼─────────────────┼────────────────┼────────┘ │
│            │                  │                │          │
│  ┌── Core Domain ────────────┼────────────────┼────────┐ │
│  │  ┌──────┴───────┐  ┌─────┴──────┐  ┌─────┴──────┐  │ │
│  │  │SubmitFeedback│  │CheckStatus │  │  Manage    │  │ │
│  │  │  UseCase     │  │  UseCase   │  │  UseCase   │  │ │
│  │  └──────┬───────┘  └─────┬──────┘  └─────┬──────┘  │ │
│  │         │                 │                │         │ │
│  │  ┌──────┴─────────────────┴────────────────┴──────┐  │ │
│  │  │          Submission Entity (DDD)                │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  └──────────────────────────┬───────────────────────────┘ │
│                             │                              │
│  ┌── Driven Adapters ───────┼───────────────────────────┐ │
│  │  ┌──────────────────┐  ┌┴────────────────┐          │ │
│  │  │ PostgresRepo     │  │  UlidGenerator  │          │ │
│  │  │ (SQLAlchemy)     │  │                 │          │ │
│  │  └────────┬─────────┘  └─────────────────┘          │ │
│  └───────────┼──────────────────────────────────────────┘ │
└──────────────┼────────────────────────────────────────────┘
               │
        ┌──────┴──────┐
        │ PostgreSQL  │
        │ (Asyncpg)   │
        └─────────────┘
```

## Component Design

### Frontend Components

| Component | Responsibility |
|-----------|---------------|
| `EncryptionService` | AES-256-GCM + RSA-OAEP via Web Crypto API |
| `SessionService` | Ephemeral token generation, SHA-256 hashing |
| `ApiClient` | HTTP communication with backend |
| `SubmissionForm` | Multi-category form with encryption indicator |
| `StatusBoard` | Real-time status lookup for current session |
| `AdminDashboard` | Decryption + status management UI |

### Backend Layers

| Layer | Contents | Dependencies |
|-------|----------|-------------|
| Core Domain | Entities, Use-Cases, Ports | None (pure Python) |
| Driving Adapters | FastAPI Routers | Core Domain |
| Driven Adapters | PostgresRepo, UlidGen | Core Domain + SQLAlchemy |
| Infrastructure | Middleware, Settings, DI | FastAPI + Adapters |

## Encryption Flow

```
1. Browser generates random 256-bit AES key
2. Browser encrypts feedback text with AES-256-GCM → ciphertext + IV
3. Browser encrypts AES key with org's RSA-OAEP public key → wrapped key
4. Browser sends: { ciphertext, IV, wrappedKey, category, impact, receiptHash }
5. Server stores encrypted blob — cannot decrypt
6. Admin loads private key in browser → decrypts AES key → decrypts feedback
```

## Data Model

### submissions table
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(26) | ULID, primary key |
| category | ENUM | idea, complaint, suggestion, positive, workplace_concern |
| impact | ENUM | low, medium, high, critical |
| encrypted_payload | TEXT | Base64 AES-256-GCM ciphertext |
| encryption_iv | VARCHAR(44) | Base64 IV |
| encrypted_symmetric_key | TEXT | Base64 RSA-OAEP wrapped key |
| receipt_hash | VARCHAR(64) | SHA-256 hex, indexed |
| status | ENUM | submitted, under_review, in_progress, resolved |
| submitted_date | DATE | 24-hour bucketed (no time) |
| status_note | TEXT | Admin notes on status changes |

## Security Design Decisions

1. **No authentication for submissions**: Reduces attack surface and ensures true anonymity.
2. **Metadata purging at middleware level**: Guarantees no IP/UA leaks even if application code has bugs.
3. **Date-only timestamps**: Prevents timing correlation attacks.
4. **Session-only tokens**: `sessionStorage` ensures tokens are destroyed on tab close.
5. **No server-side decryption**: Even a compromised server cannot read feedback.

## API Design

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `POST /api/v1/submissions` | POST | None | Submit encrypted feedback |
| `POST /api/v1/submissions/status` | POST | None | Check status by receipt hash |
| `GET /api/v1/admin/submissions` | GET | None* | List all submissions (admin) |
| `GET /api/v1/admin/submissions/:id` | GET | None* | Get single submission |
| `PATCH /api/v1/admin/submissions/:id/status` | PATCH | None* | Update status |
| `GET /health` | GET | None | Health check |

*Admin endpoints have no server-side auth — security is provided by client-side decryption. Only holders of the private key can read content.

## Deployment Architecture

- **Frontend**: Static SPA → Vercel / CloudFront CDN
- **Backend**: Docker container → AWS App Runner / Render
- **Database**: Managed PostgreSQL (RDS / Render PG)
- **Canary**: 10% traffic → new version, auto-rollback on error spike
