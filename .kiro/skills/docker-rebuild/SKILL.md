---
name: docker-rebuild
description: Rebuild and restart Spill Docker containers. Use when asked to rebuild Docker, restart services, deploy locally, or after changing backend/frontend code that needs container updates.
---

## Docker Rebuild

Rebuild and restart the full Spill stack (PostgreSQL + Backend + Frontend).

### Steps

1. **Rebuild and start in detached mode:**
```bash
docker compose up -d --build
```

2. **Verify all services are healthy:**
```bash
docker compose ps
```
Expected: 3 containers running (db healthy, backend healthy, frontend up)

3. **Test the API is serving:**
```bash
curl -s http://localhost:8000/health
```
Expected: `{"status":"ok"}`

4. **Verify public key endpoint:**
```bash
curl -s http://localhost:8000/api/v1/public-key | head -c 100
```
Expected: JSON with `public_key` field containing PEM data

### Common Issues

| Problem | Solution |
|---------|----------|
| `env_file` parse error with multiline PEM | Convert public key to single-line with `\n` escapes in `.env` |
| Frontend npm install fails in Docker | Check `package.json` for peer dependency conflicts, use compatible versions |
| Backend unhealthy | Check `docker compose logs backend` for startup errors |
| DB connection refused | Wait for db healthcheck, ensure `depends_on: condition: service_healthy` |

### Environment

- Backend: port 8000
- Frontend: port 5173
- PostgreSQL: port 5432
- Backend env from: `backend/.env` + docker-compose environment overrides
