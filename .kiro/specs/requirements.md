# Spill — Requirements Specification

## Overview

Spill is a zero-knowledge, 100% anonymous employee feedback and reporting web application. Employees submit ideas, complaints, suggestions, positive feedback, or workplace concerns with absolute privacy guaranteed through client-side encryption and metadata purging.

## Functional Requirements

### FR-1: Anonymous Feedback Submission
- **FR-1.1**: Users can submit feedback without any authentication or account creation.
- **FR-1.2**: Users select a category: Idea, Complaint, Suggestion, Positive, Workplace Concern.
- **FR-1.3**: Users select an impact level: Low, Medium, High, Critical.
- **FR-1.4**: Feedback text is encrypted client-side before network transit using AES-256-GCM.
- **FR-1.5**: A real-time encryption status indicator shows the user when content is encrypted.
- **FR-1.6**: On successful submission, a confirmation is shown with the submission ID.

### FR-2: Session-Based Status Tracking
- **FR-2.1**: An ephemeral 128-bit receipt token is generated and stored in `sessionStorage`.
- **FR-2.2**: `SHA-256(sessionToken)` is sent with submissions to link them to the session.
- **FR-2.3**: Users can view their submission statuses during the active browser session.
- **FR-2.4**: Status values: Submitted, Under Review, In Progress, Resolved.
- **FR-2.5**: Status lookup requires only the receipt hash — no identity verification.

### FR-3: Management Admin Portal
- **FR-3.1**: Managers can view all submissions (encrypted payloads).
- **FR-3.2**: Managers input their RSA private key client-side to decrypt submissions.
- **FR-3.3**: The private key never leaves the browser — decryption is local only.
- **FR-3.4**: Managers can update submission status with notes.
- **FR-3.5**: Status transitions follow a valid state machine (no skipping steps).

### FR-4: Encryption Key Management
- **FR-4.1**: Organization generates an RSA-OAEP 4096-bit key pair offline.
- **FR-4.2**: The public key is distributed with the frontend application.
- **FR-4.3**: The private key is held exclusively by authorized managers.
- **FR-4.4**: Each submission generates a fresh AES-256-GCM symmetric key.
- **FR-4.5**: The AES key is encrypted with the RSA public key before transmission.

## Non-Functional Requirements

### NFR-1: Privacy & Zero-Knowledge
- **NFR-1.1**: Server never has access to plaintext feedback content.
- **NFR-1.2**: IP addresses are stripped from all requests via middleware.
- **NFR-1.3**: User-Agent strings are purged before processing.
- **NFR-1.4**: Timestamps are rounded to 24-hour windows (date only).
- **NFR-1.5**: No cookies, JWTs, or persistent session identifiers are used.
- **NFR-1.6**: No correlation between submissions and network metadata is possible.

### NFR-2: Security
- **NFR-2.1**: All data in transit uses HTTPS/TLS 1.3.
- **NFR-2.2**: AES-256-GCM provides authenticated encryption.
- **NFR-2.3**: RSA-OAEP with SHA-256 provides asymmetric key wrapping.
- **NFR-2.4**: No server-side decryption capability exists.
- **NFR-2.5**: Input validation prevents injection attacks.

### NFR-3: Performance
- **NFR-3.1**: Submission response time < 500ms (P95).
- **NFR-3.2**: Status lookup response time < 200ms (P95).
- **NFR-3.3**: Client-side encryption completes in < 100ms.
- **NFR-3.4**: Application supports 1000+ concurrent submissions.

### NFR-4: Accessibility
- **NFR-4.1**: WCAG 2.1 AA compliance for all user-facing pages.
- **NFR-4.2**: Full keyboard navigation support.
- **NFR-4.3**: Screen reader compatible form elements.
- **NFR-4.4**: Sufficient color contrast ratios (4.5:1 minimum).

### NFR-5: Reliability
- **NFR-5.1**: 99.9% uptime SLA target.
- **NFR-5.2**: Graceful degradation if database is temporarily unavailable.
- **NFR-5.3**: Client-side validation prevents invalid submissions.

## Constraints

- **C-1**: No user accounts or identity system of any kind.
- **C-2**: No server-side logging of request metadata beyond sanitized access logs.
- **C-3**: Frontend must function as a static SPA (CDN-deployable).
- **C-4**: Backend must be stateless and horizontally scalable.
- **C-5**: All browser data is session-scoped — nothing persists after tab close.

## Production Enhancement Requirements (Phase 1-10)

### FR-5: Auto-loaded Public Key (Employee UX)
- **FR-5.1**: Organization public key served from backend (`GET /api/v1/public-key`) or bundled at build time.
- **FR-5.2**: Employees NEVER see or interact with encryption keys — encryption is transparent.
- **FR-5.3**: If no org key is configured, display: "Encryption not configured. Contact your admin."
- **FR-5.4**: Privacy trust banner displayed at top of Submit page explaining zero-knowledge guarantees.
- **FR-5.5**: Warning banner: "Submissions are final — cannot be edited or withdrawn after 24 hours."
- **FR-5.6**: Confirmation modal on submit: must confirm before encrypting/sending.
- **FR-5.7**: Idempotency key (X-Idempotency-Key header) prevents duplicate submissions.

### FR-6: Admin Authentication & MFA
- **FR-6.1**: Admin endpoints require authentication via pre-shared token (SHA-256 hashed).
- **FR-6.2**: TOTP MFA (6-digit code from authenticator app) required as second factor.
- **FR-6.3**: Account lockout after 5 failed attempts (15-minute cooldown).
- **FR-6.4**: Short-lived sessions: 8-hour absolute timeout, 30-minute idle timeout.
- **FR-6.5**: Admin login page gates access to all admin functionality.
- **FR-6.6**: All `/api/v1/admin/*` endpoints return 401 without valid session.
- **FR-6.7**: Admin CANNOT submit feedback (separation of concerns).

### FR-7: Data Lifecycle & Withdrawal
- **FR-7.1**: Configurable retention period (`SPILL_RETENTION_DAYS`, default 365).
- **FR-7.2**: Automated daily cleanup of RESOLVED submissions past retention.
- **FR-7.3**: Employee withdrawal: `DELETE /api/v1/submissions/{id}` within 24 hours using receipt_hash.
- **FR-7.4**: Withdrawal only allowed for SUBMITTED status (not IN_PROGRESS or RESOLVED).
- **FR-7.5**: Hard delete — no soft-delete, data unrecoverable after purge.

### FR-8: Operational Features
- **FR-8.1**: Admin stores org public key via `POST /api/v1/admin/public-key`.
- **FR-8.2**: Submission analytics endpoint (counts by category/impact/status, no content).
- **FR-8.3**: Admin audit log (who authenticated, status changes, timestamps).
- **FR-8.4**: SLA tracking — highlight unresolved submissions older than configurable threshold.
- **FR-8.5**: Emergency lockdown: `POST /api/v1/admin/emergency/lockdown` disables submissions.

### FR-9: Kill Switch & Maintenance Mode
- **FR-9.1**: `SPILL_MAINTENANCE=true` returns 503 on all endpoints except /health.
- **FR-9.2**: `SPILL_SUBMISSIONS_ENABLED=false` disables new submissions only.
- **FR-9.3**: Admin-triggered lockdown via API (requires auth).
- **FR-9.4**: Frontend detects 503 and displays maintenance page.

### NFR-6: Security Hardening
- **NFR-6.1**: Security headers on all responses (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- **NFR-6.2**: Request body size limit: 64KB maximum.
- **NFR-6.3**: Content-Type enforcement: reject non-JSON on POST/PATCH endpoints (415).
- **NFR-6.4**: Response sanitization: no stack traces in production errors.
- **NFR-6.5**: Remove server version header from responses.
- **NFR-6.6**: Request timeout: 30 seconds per request.
- **NFR-6.7**: Pydantic `extra="forbid"` on all request schemas.
- **NFR-6.8**: Bot protection consideration (Turnstile/hCaptcha) on submit.
- **NFR-6.9**: Submission rate limit: 10 per hour per session.

### NFR-7: Observability
- **NFR-7.1**: Structured JSON logging with `structlog` (request_id, method, path, status, latency).
- **NFR-7.2**: Prometheus metrics endpoint (`/metrics`) with counters, histograms, gauges.
- **NFR-7.3**: Health checks: `/health/live` (liveness) and `/health/ready` (readiness with DB ping).
- **NFR-7.4**: Request ID tracing (UUID v4 per request, in logs and X-Request-ID header).
- **NFR-7.5**: Failed auth alerting logic (log + flag after N failures).

### NFR-8: Australian Compliance
- **NFR-8.1**: Privacy Policy page accessible from all pages (APP 1).
- **NFR-8.2**: Privacy Collection Notice before first submission (APP 5).
- **NFR-8.3**: Data hosted in Australia only (APP 8 — data sovereignty).
- **NFR-8.4**: Data breach notification procedure documented (NDB scheme, 72-hour SLA).
- **NFR-8.5**: Essential Eight Maturity Level 2 alignment.

### NFR-9: Frontend Excellence
- **NFR-9.1**: Code splitting — lazy-load Admin page (React.lazy + Suspense).
- **NFR-9.2**: Error boundaries for graceful failure handling.
- **NFR-9.3**: Custom hooks: `useEncryption()`, `useSubmission()`.
- **NFR-9.4**: Dark mode (system preference detection + toggle).
- **NFR-9.5**: Skeleton loading states.
- **NFR-9.6**: Focus management and ARIA live regions for accessibility.
- **NFR-9.7**: Form validation with zod schema.

### NFR-10: Database Security
- **NFR-10.1**: PostgreSQL connection via SSL (`sslmode=require`).
- **NFR-10.2**: Application DB user has minimal privileges (SELECT, INSERT, UPDATE only; no DROP/CREATE).
- **NFR-10.3**: Separate cleanup user with limited DELETE permission.
- **NFR-10.4**: Audit log table (append-only, admin actions).
- **NFR-10.5**: Composite indexes for performance: (status, submitted_date DESC), (submitted_date WHERE status='resolved').

### NFR-11: Testing Maturity
- **NFR-11.1**: E2E tests (Playwright) running in CI.
- **NFR-11.2**: Accessibility tests (axe-core) in CI.
- **NFR-11.3**: Contract tests (schemathesis) validating API schema.
- **NFR-11.4**: Load test configuration (locust/k6) documented.
- **NFR-11.5**: Security regression (OWASP ZAP baseline) documented.

### NFR-12: Scalability & Resilience
- **NFR-12.1**: Circuit breaker on DB operations (retry with backoff).
- **NFR-12.2**: Graceful shutdown (drain connections, close pool).
- **NFR-12.3**: Configurable connection pool size via environment.
- **NFR-12.4**: Stateless backend — horizontally scalable.

## Future Scope (Documented, Not Implemented)
- Multi-organization support (tenant isolation)
- SSO/OIDC integration (Okta, Azure AD, Google)
- WebAuthn/Passkeys for admin
- Anonymous two-way messaging (admin replies without de-anonymization)
- Multi-admin threshold decryption (Shamir's Secret Sharing)
- Submission batching (release in weekly batches to prevent timing correlation)
- White-labeling / branding configuration (logo, colors, domain)
- PWA + offline submission queueing
- Internationalization (i18n) for multilingual workforce
- Sentiment analysis dashboard (trends without decryption)
- Custom feedback categories (admin configurable)
- Admin submission is explicitly OUT OF SCOPE
