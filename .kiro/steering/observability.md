# Observability Framework

## Structured Logging

### Implementation
- Use `structlog` with JSON output in production
- Use human-readable console output in development (SPILL_DEBUG=true)
- Every log entry includes: timestamp, level, request_id, event

### What to Log
- Request: method, path, status_code, latency_ms, request_id
- Auth: success/failure (NO tokens or codes), lockout events
- Lifecycle: app startup, shutdown, migration status
- Retention: cleanup count (NOT identifiers)
- Errors: exception type + message (NO stack traces in prod, NO request bodies)

### What NEVER to Log
- encrypted_payload, encryption_iv, encrypted_symmetric_key content
- receipt_hash values (even at DEBUG level)
- Admin tokens, TOTP codes, session tokens
- Request bodies on submission endpoints
- Private keys or any crypto material

### Log Levels
- ERROR: Unhandled exceptions, DB connection failures, critical security events
- WARNING: Rate limit hits, failed auth attempts, approaching resource limits
- INFO: Request handled, auth success, status transitions, cleanup results
- DEBUG: DB queries (development only), detailed middleware flow

## Metrics (Prometheus)

### Endpoint: GET /metrics
- Protected: only accessible from internal network or with metrics token

### Counters
- `spill_submissions_total{category, impact}` — submissions received
- `spill_admin_requests_total{endpoint, method}` — admin API usage
- `spill_auth_attempts_total{result}` — success/failure/lockout
- `spill_rate_limit_hits_total{endpoint}` — rate limit rejections
- `spill_retention_deletions_total` — automated cleanup count

### Histograms
- `spill_request_duration_seconds{method, path, status}` — response latency
- `spill_db_query_duration_seconds{operation}` — database query time

### Gauges
- `spill_db_pool_size` — current connection pool usage
- `spill_active_sessions` — admin sessions currently valid
- `spill_submissions_pending` — unresolved submissions count

## Health Checks

### GET /health/live (Liveness)
- Returns 200 if process is running
- No dependency checks
- Used by orchestrator to detect crashed processes

### GET /health/ready (Readiness)
- Returns 200 only if DB connection is healthy
- Checks: DB pool has available connections, can execute simple query
- Returns 503 if DB unreachable
- Used by load balancer to route traffic

## Request Tracing

### Request ID
- Generate UUID v4 for each request (middleware)
- Pass as `X-Request-ID` response header
- Include in all log entries for that request
- Frontend can optionally send `X-Request-ID` to correlate client/server logs

## Alerting Rules (Document for Ops)

| Condition | Severity | Action |
|-----------|----------|--------|
| Error rate > 1% for 5 minutes | HIGH | Page on-call |
| Auth failures > 5 in 5 minutes | HIGH | Alert + consider auto-lockdown |
| P95 latency > 2s for 5 minutes | MEDIUM | Investigate |
| DB pool utilization > 80% | MEDIUM | Scale or investigate |
| Submission volume > 10x normal hourly rate | MEDIUM | Possible abuse/bot |
| Health check failing for > 30 seconds | CRITICAL | Auto-restart / failover |
