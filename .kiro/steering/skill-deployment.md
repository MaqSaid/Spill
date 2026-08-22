---
inclusion: manual
---

# Skill: Deployment & Operations

Reusable deployment patterns for the Spill application. Activate this when deploying or managing infrastructure.

## Local Development Stack

```bash
# Start full stack (PostgreSQL + Backend + Frontend)
docker-compose up

# Start only database
docker-compose up db

# Rebuild after code changes
docker-compose up --build

# Stop and remove volumes
docker-compose down -v
```

### Ports
| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Uvicorn) | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | localhost:5432 |
| API Docs (debug only) | 8000 | http://localhost:8000/docs |

## Database Migrations

```bash
# Create a new migration
cd backend && alembic revision --autogenerate -m "description"

# Apply migrations
cd backend && alembic upgrade head

# Rollback one step
cd backend && alembic downgrade -1

# View current version
cd backend && alembic current
```

### Migration Rules
- Always use DATE type, never TIMESTAMP (privacy)
- Always make migrations backward-compatible for canary deployments
- Never store plaintext content fields

## Docker Build

### Backend Image
```bash
docker build -t spill-backend:latest ./backend
# Multi-stage: builder (deps) → runtime (non-root user)
# Health check: GET /health
# Runs as user 'spill' (non-root)
```

### Frontend Image
```bash
# Development
docker build -t spill-frontend:dev --target development ./frontend

# Production (nginx)
docker build -t spill-frontend:prod --target production ./frontend
```

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| SPILL_DATABASE_URL | Yes | Async PostgreSQL URL | postgresql+asyncpg://user:pass@host:5432/spill |
| SPILL_CORS_ORIGINS | Yes | Allowed origins (JSON) | ["http://localhost:5173"] |
| SPILL_DEBUG | No | Enable docs endpoints | false |
| SPILL_LOG_LEVEL | No | Logging level | INFO |

**Never commit `.env` files. Use `.env.example` as template.**

## CI/CD Pipeline (.github/workflows/ci.yml)

Jobs run in parallel:
1. `backend-lint` — Ruff + Mypy
2. `backend-security` — Bandit + pip-audit
3. `backend-test` — pytest
4. `frontend-lint` — TSC + ESLint
5. `frontend-test` — Vitest
6. `frontend-security` — npm audit
7. `docker-build` — Build both images (after tests pass)
8. `secret-scan` — GitLeaks

## Canary Deployment Procedure

1. Deploy to canary (10% traffic)
2. Monitor 15 minutes: error rate < 0.1%, P95 < 500ms, no 5xx
3. If healthy: promote 50% → 100%
4. If unhealthy: instant rollback

```bash
# Rollback
docker service update --rollback spill-backend
```

## Pre-Release Checklist

```bash
# 1. All tests pass
cd backend && python -m pytest -q --tb=short
cd frontend && npm test -- --silent

# 2. Lint clean
cd backend && python -m ruff check src/ tests/
cd frontend && node node_modules/typescript/bin/tsc --noEmit

# 3. Security scans clean
cd backend && python -m bandit -r src/ --quiet

# 4. Docker builds
docker-compose build

# 5. Submission readiness (competition-specific)
pwsh -File scripts/check-submission-readiness.ps1
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Database connection refused | Ensure PostgreSQL is running: `docker-compose up db` |
| Alembic can't find models | Run from `backend/` directory, ensure venv active |
| Frontend proxy 502 | Backend not running on port 8000 |
| Docker build cache stale | `docker-compose build --no-cache` |
| Migrations out of sync | `alembic stamp head` then `alembic upgrade head` |
