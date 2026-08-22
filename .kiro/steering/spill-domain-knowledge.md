---
inclusion: always
---

# Spill — Application Domain Knowledge

This steering file encodes the complete domain knowledge of the Spill application so that any future development session has full context without re-reading the codebase.

## What Spill Is

Spill is a zero-knowledge anonymous employee feedback platform. Employees submit encrypted feedback that the server cannot decrypt. Only authorized managers with the RSA private key can read submissions.

## Core Domain Concepts

### Submission Lifecycle (State Machine)
```
SUBMITTED → UNDER_REVIEW → IN_PROGRESS → RESOLVED
                         → RESOLVED (skip IN_PROGRESS)
```
- Transitions are enforced by the `Submission.transition_status()` method
- No backward transitions. RESOLVED is terminal.
- State machine lives in `backend/src/spill/core/entities/submission.py`

### Encryption Flow
1. Browser generates random AES-256-GCM key + 12-byte IV
2. Feedback encrypted with AES-GCM → ciphertext
3. AES key wrapped with org's RSA-OAEP 4096-bit public key
4. Server stores: `{ encrypted_payload, encryption_iv, encrypted_symmetric_key }`
5. Admin unwraps AES key with private key → decrypts ciphertext

### Privacy Guarantees (Non-Negotiable)
- Server NEVER has plaintext feedback
- No IP addresses stored (middleware overrides to 0.0.0.0)
- No User-Agent strings stored
- Timestamps bucketed to DATE only (no time precision)
- Session tokens in sessionStorage only (destroyed on tab close)
- Only SHA-256(token) sent to server — token itself never leaves browser

## Architecture Map

```
backend/src/spill/
├── core/                    # PURE PYTHON — zero framework imports
│   ├── entities/            # Submission (frozen dataclass, state machine)
│   ├── ports/               # Repository Protocol, IdGenerator Protocol
│   └── use_cases/           # SubmitFeedback, CheckStatus, ManageSubmissions
├── adapters/
│   ├── api/                 # FastAPI routers, middleware, schemas, rate limiter
│   │   ├── app.py           # App factory (CORS + MetadataPurging + RateLimiter)
│   │   ├── middleware.py    # MetadataPurgingMiddleware
│   │   ├── rate_limiter.py  # Global rate limiter for admin endpoints
│   │   ├── routers/         # submissions.py, admin.py, health.py
│   │   └── dependencies.py  # FastAPI DI wiring
│   ├── db/                  # SQLAlchemy models, PostgresSubmissionRepository
│   └── id_gen.py            # UlidGenerator adapter
└── config/                  # Pydantic settings

frontend/src/
├── services/
│   ├── encryption.ts        # Web Crypto: encryptFeedback, decryptFeedback, generateKeyPair
│   ├── session.ts           # getSessionToken, getReceiptHash, hasSessionToken
│   └── api.ts               # submitFeedback, checkStatus, adminListSubmissions
├── pages/
│   ├── SubmitPage.tsx        # Form + encryption indicator + client-side encrypt
│   ├── StatusPage.tsx        # Session-scoped status tracking
│   └── AdminPage.tsx         # Key import + decrypt + status management
└── components/
    └── EncryptionIndicator.tsx
```

## Key Decisions (Reference ADRs in docs/adr/)
- Hexagonal architecture: core has zero framework deps
- AES-256-GCM + RSA-OAEP 4096-bit: crypto standards
- DATE only (no TIMESTAMP): timing attack prevention
- ULID for IDs: sortable, no coordination needed
- sessionStorage only: no cross-session tracking possible

## When Modifying This Application
1. Never add imports from fastapi/sqlalchemy into `core/`
2. Never log encrypted_payload, encryption_iv, or encrypted_symmetric_key content
3. Never use localStorage — only sessionStorage
4. Never store precise timestamps — use date only
5. All new endpoints must go through MetadataPurgingMiddleware (automatic via app factory)
6. Test files use pytest (backend) and vitest (frontend)
7. Run `ruff check` and `tsc --noEmit` before considering code complete
