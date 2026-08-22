# Security Posture — Spill

## DevSecOps Pipeline Overview

Spill implements a comprehensive shift-left security strategy where security checks are integrated at every stage of development, not bolted on at the end.

```
Developer → Pre-commit → CI/CD → Docker Build → Runtime
    │           │           │          │           │
    ├── Kiro    ├── GitLeaks├── Bandit ├── Trivy  ├── MetadataPurging
    │   hooks   ├── Ruff    ├── Mypy   ├── Non-   ├── RateLimiter
    │           ├── Mypy    ├── pip-   │   root   ├── CORS
    │           │           │   audit  │   user   │
    │           │           ├── npm    │          │
    │           │           │   audit  │          │
    │           │           ├── GitLeaks          │
    │           │           ├── ESLint            │
    │           │           └── TSC               │
```

## SAST (Static Application Security Testing)

| Tool | Language | What It Catches | Stage |
|------|----------|-----------------|-------|
| **Bandit** | Python | SQL injection, shell injection, hardcoded secrets, unsafe deserialization | Pre-commit + CI |
| **Ruff (security rules)** | Python | Assert in production, binding to 0.0.0.0 (intentional), eval usage | Pre-commit + CI |
| **Mypy (strict)** | Python | Type confusion, None safety, incorrect interfaces | Pre-commit + CI |
| **ESLint** | TypeScript | XSS via dangerouslySetInnerHTML, prototype pollution patterns | CI |
| **TypeScript (strict)** | TypeScript | Type errors, null/undefined safety, missing checks | CI |

## SCA (Software Composition Analysis)

| Tool | Scope | What It Catches | Stage |
|------|-------|-----------------|-------|
| **pip-audit** | Python deps | Known CVEs in Python packages | CI |
| **npm audit** | Node deps | Known CVEs in npm packages | CI |
| **GitLeaks** | Repository | Accidentally committed secrets, API keys, private keys | Pre-commit + CI |

## Container Security

| Tool | What It Catches | Stage |
|------|-----------------|-------|
| **Multi-stage builds** | Reduces attack surface (no build tools in runtime) | Docker build |
| **Non-root user** | Prevents privilege escalation if container is compromised | Docker runtime |
| **Pinned base images** | Prevents supply chain attacks via mutable tags | Dockerfile |
| **Health checks** | Detects compromised/crashed containers | Docker runtime |

## Runtime Security

| Mechanism | Purpose |
|-----------|---------|
| **MetadataPurgingMiddleware** | Strips all identifying headers before processing |
| **RateLimiterMiddleware** | Prevents brute-force enumeration of admin endpoints |
| **CORS (strict origins)** | Prevents cross-origin attacks |
| **No cookies/JWTs** | Eliminates CSRF and session hijacking attack surfaces |
| **Input validation (Pydantic)** | Prevents injection via strict schema validation |
| **TLS termination** | Encrypts transport (defense-in-depth, content already E2E encrypted) |

## Supply Chain Security

### Dependency Pinning
- **Backend**: All versions pinned in `pyproject.toml` (e.g., `fastapi==0.115.0`)
- **Frontend**: Lock file (`package-lock.json`) ensures reproducible installs
- **Docker**: Base images use specific tags (not `:latest`)

### Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
- GitLeaks: Secret scanning
- Ruff: Lint + format
- Mypy: Type checking
- Trailing whitespace / EOF: Hygiene
- Private key detection: Prevents key commits
```

### Kiro Agent Hooks (Shift-Left)
```
- validate-no-secrets.json: Blocks file writes containing secrets
- security-scan-on-save.json: Runs Bandit on Python saves
- security-review-post-write.json: Verifies zero-knowledge invariants
- dependency-security-scan.json: Audits new dependencies
```

## Architecture Security

### Zero-Knowledge Guarantee (Cryptographic)
- Server CANNOT decrypt feedback (no private key, no decryption code)
- Verified by `test_security.py::TestZeroKnowledgeProperties::test_no_decryption_capability_on_server`

### Hexagonal Boundary Enforcement
- Core domain has zero framework dependencies (verified by `test_architecture.py`)
- Prevents accidental exposure of business logic to HTTP layer

### Immutable Domain Entities
- `@dataclass(frozen=True)` prevents mutation after creation
- State transitions produce new objects (functional style)

## What We Intentionally Do NOT Have (and Why)

| Missing Feature | Reason |
|-----------------|--------|
| User authentication | Violates anonymity guarantee |
| Per-user rate limiting | Would require identity tracking |
| Server-side logging of payloads | Would expose encrypted content |
| HTTPS certificate in repo | Managed by infrastructure, not app |
| WAF rules | Deployment-environment specific |
| DAST (runtime scanning) | Requires deployed instance; covered by architecture tests + threat model instead |

## Compliance Summary

| Standard | Status |
|----------|--------|
| OWASP Top 10 (2021) | Addressed — no injection, no auth flaws, no sensitive data exposure |
| WCAG 2.0 AA | Partial — skip-to-content, ARIA labels, focus rings, color contrast |
| Zero-Knowledge | Proven — cryptographic + architectural + test verification |
| Least Privilege | Docker non-root, minimal CORS, no unnecessary permissions |
