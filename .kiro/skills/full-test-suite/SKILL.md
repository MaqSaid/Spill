---
name: full-test-suite
description: Run the complete test suite for Spill - backend pytest (unit, integration, property-based), frontend vitest, TypeScript strict check, and ruff linter. Use when asked to run all tests, verify the build, check quality, or validate before commit/deploy.
---

## Full Test Suite

Run all quality checks for the Spill application in this order:

### 1. Backend Tests (pytest)
```bash
cd backend && python -m pytest -q --tb=short
```
- Runs unit tests, integration tests, and Hypothesis property-based tests
- Expected: 55+ tests pass

### 2. Frontend Tests (vitest)
```bash
cd frontend && npx vitest run --reporter=dot
```
- Runs encryption service, session service, and encryption round-trip tests
- Expected: 22+ tests pass

### 3. TypeScript Strict Check
```bash
cd frontend && npx tsc --noEmit
```
- Validates all TypeScript types with strict mode
- Expected: 0 errors

### 4. Python Linter (ruff)
```bash
cd backend && ruff check src/
```
- Checks Python code quality and style
- Expected: "All checks passed!"

### Failure Handling
- If backend tests fail: check if database is running (`docker compose ps`)
- If frontend tests fail: check if `node_modules` exists (`npm install` if missing)
- If ruff fails: run `ruff check src/ --fix` for auto-fixable issues
- If tsc fails: read the specific file and fix type errors

### Success Criteria
All 4 checks must pass before considering code ready for commit or deployment.
