# Security & Privacy Guidelines — Spill

## Zero-Knowledge Privacy Non-Negotiables

These rules are ABSOLUTE and must never be violated:

### 1. No Plaintext on Server
- The server MUST never have access to unencrypted feedback content.
- All encryption/decryption happens exclusively in the browser.
- If a code change introduces server-side decryption capability, REJECT it.

### 2. No Identity Tracking
- No user accounts, sessions cookies, or JWTs for submissions.
- No `localStorage` usage — only `sessionStorage` for receipt tokens.
- No persistent identifiers of any kind.

### 3. Metadata Purging
- `MetadataPurgingMiddleware` MUST be active on all routes.
- Headers purged: X-Forwarded-For, X-Real-IP, User-Agent, CF-Connecting-IP, Via, Forwarded.
- Client IP in ASGI scope MUST be overridden to 0.0.0.0.

### 4. Timestamp Bucketing
- Database stores `DATE` only — no `TIMESTAMP` or `DATETIME`.
- All time precision is limited to 24-hour windows.
- This prevents timing correlation attacks.

### 5. Encryption Standards
- **Symmetric**: AES-256-GCM (authenticated encryption).
- **Asymmetric**: RSA-OAEP with SHA-256, 4096-bit key minimum.
- **Hashing**: SHA-256 for receipt token hashing.
- **Random**: `window.crypto.getRandomValues()` for all randomness.

## Security Scanning Requirements

### Static Analysis (Shift-Left)
- **Bandit**: Python security linting (no S104 — binding to 0.0.0.0 is intentional for Docker).
- **Semgrep**: Custom rules for detecting plaintext logging of payloads.
- **GitLeaks**: Pre-commit secret scanning.
- **ESLint Security Plugin**: Frontend XSS/injection detection.

### Dependency Scanning
- **pip-audit**: Python dependency vulnerability checks.
- **npm audit**: Frontend dependency vulnerability checks.
- **Trivy**: Container image scanning.

## Logging Rules

- NEVER log `encrypted_payload`, `encryption_iv`, or `encrypted_symmetric_key` content.
- NEVER log receipt hashes at DEBUG level (only at TRACE for development).
- Log ONLY: request method, path, response status code, response time.
- No request body logging in production.
