---
inclusion: manual
---

# Skill: Testing Workflows

Reusable testing patterns for the Spill application. Activate this when working on tests.

## Test Commands (Quick Reference)

```bash
# Backend — all tests (quiet mode)
cd backend && python -m pytest -q --tb=short

# Backend — specific test file
cd backend && python -m pytest tests/unit/test_architecture.py -q

# Backend — by keyword
cd backend && python -m pytest -k "test_rate_limiter" -q

# Frontend — all tests (silent)
cd frontend && npm test -- --silent

# Frontend — specific file
cd frontend && npm test -- --silent src/test/encryption-roundtrip.test.ts

# Frontend — E2E (requires backend running)
cd frontend && npx playwright test

# Lint check (backend)
cd backend && python -m ruff check src/ tests/

# Type check (frontend)
cd frontend && node node_modules/typescript/bin/tsc --noEmit
```

## Test Categories & When to Use

| Category | Tool | When to Run | Directory |
|----------|------|-------------|-----------|
| Unit (domain) | pytest | After changing core/ entities or use cases | backend/tests/unit/ |
| Property-based | pytest + Hypothesis | After changing entity validation or state machine | backend/tests/unit/test_hypothesis.py |
| Integration (API) | pytest + httpx | After changing routers, middleware, or schemas | backend/tests/integration/ |
| Architecture boundary | pytest + AST | After adding any import to core/ | backend/tests/unit/test_architecture.py |
| Security | pytest | After changing middleware, logging, or rate limiter | backend/tests/integration/test_security.py |
| Encryption round-trip | vitest | After changing encryption.ts | frontend/src/test/encryption-roundtrip.test.ts |
| Session service | vitest | After changing session.ts | frontend/src/test/session.test.ts |
| E2E | Playwright | Before release — tests full UI flow | frontend/e2e/ |

## Writing New Tests

### Backend Test Pattern
```python
"""Describe what this test file validates."""

from __future__ import annotations
import pytest
from spill.core.entities.submission import Submission, Category, ImpactLevel, SubmissionStatus

class TestFeatureName:
    """Group related tests."""

    async def test_specific_behavior(self, mock_repository, sample_submission):
        """Describe expected behavior."""
        # Arrange
        mock_repository.find_by_id.return_value = sample_submission
        # Act
        result = await use_case.method(...)
        # Assert
        assert result is not None
```

### Frontend Test Pattern
```typescript
import { describe, it, expect } from "vitest";
import { functionUnderTest } from "../services/module";

describe("Feature Name", () => {
  it("describes expected behavior", async () => {
    const result = await functionUnderTest(input);
    expect(result).toBe(expected);
  });
});
```

## Shared Fixtures (backend/tests/conftest.py)
- `sample_submission` — A Submission entity in SUBMITTED state
- `mock_repository` — AsyncMock with all repository methods
- `mock_id_generator` — Returns predictable ULID

## Rules
- Tests use `assert` (pytest) not `assertEqual`
- Suppress `S101` for test files via pyproject.toml per-file-ignores
- Never mock the domain entity itself — test it directly
- Integration tests can read source files for static analysis (AST-based)
- All tests must pass with `pytest -q` (no verbose output in CI)
