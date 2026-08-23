---
name: security-audit
description: Run comprehensive security audit for Spill - npm audit, pip-audit, security headers check, API penetration testing, and compliance verification. Use when asked to check security, audit dependencies, verify headers, or prepare for deployment.
---

## Security Audit

Complete security verification for the Spill zero-knowledge feedback platform.

### 1. Frontend Dependency Scan
```bash
cd frontend && npm audit
```
- Check for known CVEs in npm packages
- Note: react-router-dom SSR vulnerabilities are not exploitable (client-only SPA)
- Fix with `npm audit fix` (avoid `--force` which may introduce breaking changes)

### 2. Backend Dependency Scan
```bash
pip-audit
```
- Check Python packages for known vulnerabilities
- Note starlette version — upgrade path requires FastAPI major version change

### 3. Security Headers Verification
Test with:
```bash
curl -sI http://localhost:8000/health
```
Required headers (all must be present):
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy: default-src 'self'...`
- `Cache-Control: no-store, no-cache, must-revalidate`

### 4. API Error Handling Verification
```bash
# Test invalid submission (should return 422, no stack trace)
curl -s -X POST http://localhost:8000/api/v1/submissions -H "Content-Type: application/json" -d '{"bad":"data"}'

# Test unauthorized admin access (should return 401, generic message)
curl -s http://localhost:8000/api/v1/admin/submissions
```

### 5. Zero-Knowledge Compliance Checklist
- [ ] No localStorage in frontend (only sessionStorage)
- [ ] No plaintext feedback logged server-side
- [ ] MetadataPurgingMiddleware active (strips IP, User-Agent)
- [ ] Timestamps are DATE only (no time precision)
- [ ] RSA-OAEP 4096-bit + AES-256-GCM encryption
- [ ] Private key never touches the server
- [ ] Receipt hash is SHA-256 of ephemeral token

### 6. Rate Limiting Check
- Submission endpoint: 10/hour per session
- Status check: 60/minute per session
- Admin auth: 5 attempts per 15 minutes (lockout)
- Admin endpoints: 100 requests per 60 seconds (global)
