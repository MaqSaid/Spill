# Kiro Usage Narrative — Spill

This document describes how Kiro's AI-powered development features were used throughout the development of Spill, a zero-knowledge anonymous feedback platform.

## Spec-Driven Development

Spill was built using Kiro's **Specs** workflow — a structured approach that breaks feature development into three phases:

### Requirements Phase (`.kiro/specs/requirements.md`)
- Defined 4 functional requirement groups (FR-1 through FR-4) covering submission, status tracking, admin portal, and key management
- Defined 5 non-functional requirement groups covering privacy, security, performance, accessibility, and reliability
- Established 5 hard constraints (no accounts, no server-side logging, static SPA, stateless backend, session-scoped data)

### Design Phase (`.kiro/specs/design.md`)
- Produced architecture diagrams showing the hexagonal architecture layers
- Defined component responsibilities for both frontend and backend
- Documented the encryption flow step-by-step
- Specified the data model with privacy annotations

### Tasks Phase (`.kiro/specs/tasks.md`)
- Generated 32 implementation tasks across 5 phases
- Each task was specific, actionable, and independently verifiable
- Tasks were completed sequentially, with Kiro tracking progress

**Value**: The spec workflow prevented scope creep and ensured every feature traced back to a requirement. When implementation decisions arose, the design document served as the source of truth.

## Steering Files (11 files)

Steering files in `.kiro/steering/` provide persistent context that influences every interaction:

| File | Purpose |
|------|---------|
| `architecture.md` | Enforces hexagonal architecture rules (no framework imports in core) |
| `security.md` | Zero-knowledge non-negotiables, encryption standards, logging rules |
| `deployment.md` | Canary deployment procedure, environment variables, Docker guidelines |
| `development-standards.md` | Code quality, dependency management, file organization |
| `testing-best-practices.md` | Test execution patterns, organization, CI considerations |
| `git-best-practices.md` | Conventional commits, branching strategy, security |
| `mcp-best-practices.md` | MCP server configuration and zero-cost tool recommendations |
| `python-best-practices.md` | Python 3.11+ patterns, type annotations, async conventions |
| `react-best-practices.md` | React functional components, hooks patterns, accessibility |
| `typescript-best-practices.md` | Strict mode, interface preferences, type safety |
| `docker-best-practices.md` | Multi-stage builds, non-root users, layer optimization |

**Value**: Steering files act as a persistent "team standards" document. Every code generation respects these constraints without needing to repeat them in prompts. The security steering file is particularly critical — it ensures the AI never generates code that violates zero-knowledge principles.

## Agent Hooks (10 hooks)

Hooks automate quality checks on every file save and operation:

### Code Quality Hooks
- **`lint-python-on-save.json`**: Runs Ruff on Python file saves
- **`lint-frontend-on-save.json`**: Runs ESLint on TypeScript/React saves
- **`auto-test-on-save.json`**: Triggers relevant tests after source changes

### Security Hooks
- **`security-scan-on-save.json`**: Runs Bandit on Python files
- **`security-review-post-write.json`**: Verifies no plaintext logging, no localStorage, correct encryption standards after every file write
- **`validate-no-secrets.json`**: Checks for hardcoded secrets before file writes
- **`dependency-security-scan.json`**: Audits dependencies for vulnerabilities

### Workflow Hooks
- **`commit-message-helper.json`**: Ensures conventional commit format
- **`docker-validation.json`**: Validates Dockerfile best practices
- **`env-file-validation.json`**: Checks environment file safety

**Value**: Hooks create a "shift-left" safety net. The security-review hook caught multiple potential violations during development — for example, flagging when a debug logging statement would have logged encrypted payload content. This automated enforcement is more reliable than manual code review.

## Pre-Commit Hooks (via `.pre-commit-config.yaml`)

Complementing Kiro's agent hooks, traditional git pre-commit hooks provide a final gate:

- **GitLeaks**: Scans for accidentally committed secrets
- **Ruff**: Format and lint checking
- **Mypy**: Static type checking (strict mode)
- **Trailing whitespace / EOF fixes**: Code hygiene

## How Kiro Features Work Together

```
Developer writes code
       │
       ├── PostFileSave hook → lint + test
       ├── PreToolUse hook → security verification
       │
       ▼
Kiro generates code (influenced by steering)
       │
       ├── Respects architecture.md → hexagonal layers
       ├── Respects security.md → no plaintext logging
       ├── Respects testing.md → silent mode, focused tests
       │
       ▼
Pre-commit hooks (final gate)
       │
       ├── GitLeaks → no secrets
       ├── Ruff → formatting
       ├── Mypy → type safety
       │
       ▼
CI/CD pipeline validates everything
```

## Lessons Learned

1. **Steering files are the highest-leverage feature**: They eliminate repetitive prompting and ensure consistent quality across sessions.
2. **Security hooks prevent drift**: Without automated enforcement, it's easy to accidentally introduce plaintext logging or localStorage usage during rapid development.
3. **Specs provide accountability**: The tasks list serves as both a progress tracker and a definition of done.
4. **Hooks should be lightweight**: Heavy hooks (full test suites) slow down the feedback loop. Use focused, fast checks for on-save hooks and comprehensive checks for pre-commit.
