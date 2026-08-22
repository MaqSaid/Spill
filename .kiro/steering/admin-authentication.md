# Admin Authentication & Authorization

## Authentication Flow

### Token + TOTP (Two-Factor)
1. Admin enters pre-shared token (256-bit random, stored as SHA-256 hash on server)
2. Admin enters 6-digit TOTP code from authenticator app (Google Authenticator, Authy, etc.)
3. Server validates both factors
4. Server issues short-lived session token (stored in sessionStorage)
5. All subsequent admin requests include session token in Authorization header

### Session Management
- Session lifetime: 8 hours maximum (absolute timeout)
- Idle timeout: 30 minutes of inactivity
- Storage: sessionStorage only (dies on tab close)
- Format: cryptographically random 256-bit token
- Server stores: SHA-256(session_token) + expiry timestamp

### Account Lockout
- Lock after 5 consecutive failed authentication attempts
- Lockout duration: 15 minutes (auto-unlock)
- Log all failed attempts (timestamp + attempt count only — no tokens/codes)

## Environment Configuration
```
SPILL_ADMIN_TOKEN_HASH=<SHA-256 hash of admin token>
SPILL_ADMIN_TOTP_SECRET=<Base32-encoded TOTP secret>
SPILL_ADMIN_SESSION_TTL=28800  # 8 hours in seconds
SPILL_ADMIN_IDLE_TTL=1800      # 30 minutes in seconds
SPILL_ADMIN_MAX_ATTEMPTS=5
SPILL_ADMIN_LOCKOUT_SECONDS=900
```

## Endpoint Protection
- ALL `/api/v1/admin/*` endpoints MUST require valid session token
- Session validation via FastAPI dependency injection
- Return 401 Unauthorized for missing/invalid/expired sessions
- Return 423 Locked for lockout state

## Implementation Rules
- NEVER store raw admin token on server — only SHA-256 hash
- NEVER log admin tokens, TOTP codes, or session tokens
- Use `hmac.compare_digest()` for timing-safe comparison
- TOTP window: allow 1 step tolerance (previous + current + next 30s window)
- Session tokens generated with `secrets.token_hex(32)`

## Admin Cannot
- Submit feedback (separation of concerns)
- Access employee session tokens or receipt hashes directly
- Disable encryption or bypass zero-knowledge
