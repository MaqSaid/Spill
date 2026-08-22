# Architecture Guidelines — Spill

## Hexagonal Architecture (Ports and Adapters)

### Layer Rules

1. **Core Domain** (`backend/src/spill/core/`):
   - MUST contain zero imports from FastAPI, SQLAlchemy, or any framework.
   - Entities are immutable `@dataclass(frozen=True, slots=True)`.
   - Use-cases depend ONLY on ports (typing.Protocol).
   - All business rules live here — adapters are dumb plumbing.

2. **Ports** (`backend/src/spill/core/ports/`):
   - Defined as `typing.Protocol` classes.
   - No concrete implementations allowed in this directory.
   - Ports define the contract; adapters fulfill it.

3. **Driving Adapters** (`backend/src/spill/adapters/api/`):
   - FastAPI routers translate HTTP requests into use-case calls.
   - No business logic in routers — they are thin translation layers.
   - Pydantic schemas handle serialization/validation only.

4. **Driven Adapters** (`backend/src/spill/adapters/db/`, `backend/src/spill/adapters/`):
   - Implement port protocols with concrete infrastructure.
   - Can import SQLAlchemy, asyncpg, external SDKs.
   - Must be swappable without touching core domain.

### Dependency Rule

```
Adapters → Core Domain ← Adapters
          (never reversed)
```

Core domain NEVER imports from adapters. Dependency injection connects them at runtime.

## Frontend Architecture

- **Services layer** (`frontend/src/services/`): Encryption, session, API client.
- **Components** (`frontend/src/components/`): Reusable UI elements.
- **Pages** (`frontend/src/pages/`): Route-level page components.
- Services are pure functions/classes — no React dependencies in service code.

## Code Conventions

### Python (Backend)
- Python 3.11+ features: `from __future__ import annotations`, `X | None` union syntax.
- Type annotations required on all functions.
- Docstrings on all public classes and functions.
- Use `ruff` for formatting and linting.
- Use `mypy --strict` for type checking.

### TypeScript (Frontend)
- Strict TypeScript mode (`strict: true`).
- Prefer `interface` over `type` for object shapes.
- Use React functional components with hooks.
- No `any` types — use `unknown` with type guards.
- Tailwind CSS for styling — no CSS modules or styled-components.
