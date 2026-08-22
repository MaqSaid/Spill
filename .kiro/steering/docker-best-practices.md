---
title: Docker Best Practices
inclusion: fileMatch
fileMatchPattern: "Dockerfile*,docker-compose*,*.dockerfile"
---

# Docker Best Practices

## Dockerfile Optimization
- Use multi-stage builds to reduce final image size
- Use specific base image tags (e.g., `python:3.11-slim`), never `latest`
- Minimize layers by combining related RUN commands
- Use `.dockerignore` to exclude unnecessary files (tests, docs, .git)
- Order layers from least to most frequently changing (deps before code)
- Use build cache effectively — copy dependency files before source code

## Security
- Run as non-root user (`USER spill`) in production containers
- Scan images for vulnerabilities (`trivy image`)
- Use minimal base images (alpine, slim, distroless)
- Never include secrets in image layers — use runtime env vars
- Keep base images updated with security patches
- Use `HEALTHCHECK` for container orchestrator probes

## Performance
- Clean up package manager caches in the same RUN layer
- Use `.dockerignore` to minimize build context size
- Use appropriate COPY (not ADD) for local files
- Set `--no-cache-dir` for pip installs

## Docker Compose
- Use health checks with `condition: service_healthy` for dependencies
- Set resource limits for production deployments
- Use named volumes for persistent data
- Use environment variables for configuration — never hardcode
- Pin service image versions

## Best Practices
- Use LABEL for image metadata (maintainer, version, description)
- Set appropriate WORKDIR early in Dockerfile
- Use EXPOSE for documentation of ports
- One process per container (PID 1 signals)
- Log to stdout/stderr (not files) for container log aggregation
