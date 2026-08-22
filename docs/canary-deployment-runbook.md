# Canary Deployment Runbook — Spill

## Overview

This runbook covers the canary deployment process for Spill backend and frontend services.

## Pre-Deployment Checklist

- [ ] All unit tests pass (`cd backend && pytest`)
- [ ] All property-based tests pass (Hypothesis)
- [ ] Integration tests pass (`pytest tests/integration/`)
- [ ] Frontend tests pass (`cd frontend && npm test`)
- [ ] Security scans clean:
  - [ ] `bandit -r backend/src/`
  - [ ] `npm audit --production` (frontend)
  - [ ] `trivy image spill-backend:latest`
- [ ] Docker image builds successfully
- [ ] Database migrations are backward-compatible
- [ ] Pre-commit hooks pass (`pre-commit run --all-files`)

## Deployment Steps

### 1. Build and Tag

```bash
# Build backend image
docker build -t spill-backend:canary ./backend

# Build frontend (static assets)
cd frontend && npm run build
```

### 2. Deploy Canary (10% Traffic)

```bash
# Deploy to canary target
docker service update \
  --image spill-backend:canary \
  --update-order start-first \
  --rollback-order stop-first \
  spill-backend-canary
```

### 3. Monitor (15 minutes)

Monitor these metrics:
- **Error Rate**: Must stay below 0.1%
- **P95 Latency**: Must stay below 500ms
- **5xx Responses**: Must be zero
- **Health Check**: `/health` must return 200

```bash
# Quick health check
curl -s http://canary.spill.internal/health | jq .
```

### 4. Promote or Rollback

**If healthy** — promote to full traffic:
```bash
docker service update \
  --image spill-backend:canary \
  spill-backend
```

**If unhealthy** — immediate rollback:
```bash
docker service update --rollback spill-backend-canary
```

## Rollback Procedure

### Instant Rollback (< 30 seconds)

```bash
# Rollback to previous version
docker service update --rollback spill-backend

# Or specify exact previous image
docker service update --image spill-backend:v1.2.3 spill-backend
```

### Database Rollback

Only needed if migration was applied:
```bash
cd backend
alembic downgrade -1
```

## Post-Deployment Verification

- [ ] Health endpoint responds: `GET /health`
- [ ] Submission endpoint accepts valid payload: `POST /api/v1/submissions`
- [ ] Status endpoint works: `POST /api/v1/submissions/status`
- [ ] Admin listing works: `GET /api/v1/admin/submissions`
- [ ] No plaintext in logs (verify with `docker logs spill-backend | grep -i plaintext`)
- [ ] Frontend loads correctly at production URL

## Emergency Contacts

- On-call engineer: Check PagerDuty rotation
- Database admin: For migration issues
- Security team: If privacy breach suspected
