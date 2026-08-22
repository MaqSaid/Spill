# Request Hardening Standards

## Body Size Limits
- Maximum request body: 64KB (65536 bytes)
- Reject oversized requests with 413 Payload Too Large
- Apply BEFORE parsing JSON to prevent memory exhaustion

## Content-Type Enforcement
- POST/PATCH/PUT endpoints MUST receive Content-Type: application/json
- Reject non-JSON with 415 Unsupported Media Type
- GET/DELETE requests do not require Content-Type

## Request Timeouts
- All requests: 30-second maximum processing time
- Return 504 Gateway Timeout if exceeded
- Configure via uvicorn --timeout-keep-alive

## Idempotency
- Submit endpoint accepts optional X-Idempotency-Key header (UUID v4)
- Duplicate key within 5 minutes returns cached 201 response (no re-submission)
- Keys stored in-memory with TTL eviction

## Per-Session Rate Limiting
- Submissions: max 10 per hour per receipt_hash
- Status checks: max 60 per minute per receipt_hash
- Auth attempts: max 5 per 15 minutes (handled by lockout)

## Response Sanitization
- Production (SPILL_DEBUG=false): generic error messages only
- Never expose: file paths, stack traces, internal server details
- Format: {"detail": "Human-readable message"}
- Custom exception handler overrides FastAPI defaults

## Circuit Breaker (DB Operations)
- Retry transient DB failures with exponential backoff
- Max 3 retries with delays: 100ms, 500ms, 2s
- After circuit opens: fail fast for 30 seconds
- Use tenacity library for retry logic
