# Deployment & Operations Guidelines — Spill

## Canary Deployment Procedure

### Pre-Deployment Checks
1. All tests pass (unit, integration, property-based).
2. Security scans clean (Bandit, Semgrep, Trivy).
3. Docker image builds successfully.
4. Migration compatibility verified (backward-compatible schema changes only).

### Canary Steps
1. Deploy new version to canary target (10% traffic).
2. Monitor for 15 minutes:
   - Error rate < 0.1%
   - P95 latency < 500ms
   - No 5xx responses
3. If healthy: promote to 50% → 100% over 30 minutes.
4. If unhealthy: instant rollback to previous version.

### Rollback Procedure
```bash
# Immediate rollback (< 30 seconds)
docker service update --rollback spill-backend

# Or with specific image
docker service update --image spill-backend:previous-tag spill-backend
```

## Environment Configuration

### Required Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| SPILL_DATABASE_URL | PostgreSQL async connection string | postgresql+asyncpg://user:pass@host:5432/spill |
| SPILL_CORS_ORIGINS | Allowed frontend origins (JSON list) | ["https://spill.company.com"] |
| SPILL_DEBUG | Enable debug mode | false |
| SPILL_LOG_LEVEL | Logging level | INFO |

### Production Hardening
- `SPILL_DEBUG=false` (disables /docs and /redoc)
- TLS termination at load balancer/CDN level
- Database connection pooling (pgbouncer or built-in SQLAlchemy pool)
- Health check endpoint at `/health` for orchestrator probes

## Docker Guidelines
- Multi-stage builds to minimize image size.
- Non-root user in production container.
- No secrets in Docker image layers — use runtime env vars.
- Pin base image versions for reproducibility.
