# Spill — Implementation Tasks

## Phase 1: Foundation

- [x] Task 1: Initialize repository structure (monorepo layout)
- [x] Task 2: Create backend Python project with pyproject.toml
- [x] Task 3: Define core domain entities (Submission, Category, Impact, Status)
- [x] Task 4: Define repository port (typing.Protocol)
- [x] Task 5: Implement use-cases (SubmitFeedback, CheckStatus, ManageSubmissions)
- [x] Task 6: Create SQLAlchemy models and Alembic migration
- [x] Task 7: Implement PostgresSubmissionRepository adapter
- [x] Task 8: Create FastAPI app factory with MetadataPurgingMiddleware
- [x] Task 9: Implement API routers (submissions, admin, health)
- [x] Task 10: Configure dependency injection (FastAPI Depends)

## Phase 2: Frontend

- [x] Task 11: Initialize React + Vite + TypeScript + Tailwind CSS project
- [x] Task 12: Implement encryption service (Web Crypto API)
- [x] Task 13: Implement session service (token generation, SHA-256 hashing)
- [x] Task 14: Create API client service
- [x] Task 15: Build Employee Portal — SubmissionForm component
- [x] Task 16: Build Active Session Board — StatusBoard component
- [x] Task 17: Build Management Admin Portal — AdminDashboard component
- [x] Task 18: Implement routing (React Router)
- [x] Task 19: Add encryption status indicator UI

## Phase 3: Kiro Configuration

- [x] Task 20: Create .kiro/steering/ files (architecture, security, deployment)
- [x] Task 21: Create .kiro/hooks/ (lint, security scan, test hooks)
- [x] Task 22: Create .kiro/specs/ (requirements.md, design.md, tasks.md)

## Phase 4: Testing

- [x] Task 23: Write Pytest unit tests for domain entities
- [x] Task 24: Write Hypothesis property-based tests
- [x] Task 25: Write API integration tests (httpx + FastAPI TestClient)
- [x] Task 26: Write Vitest unit tests for frontend components
- [x] Task 27: Create Playwright E2E test skeleton

## Phase 5: Infrastructure & Deployment

- [x] Task 28: Create backend Dockerfile
- [x] Task 29: Create docker-compose.yml (full stack)
- [x] Task 30: Create canary deployment runbook
- [x] Task 31: Configure pre-commit hooks (GitLeaks, Ruff, Mypy)
- [x] Task 32: Create .env.example files

## Completion Criteria

- All domain logic covered by unit + property tests
- E2E flow verified: encrypt in browser → submit → admin decrypt
- No plaintext feedback visible in server logs or database
- Middleware confirmed to strip IP/UA/headers
- Docker stack boots with `docker-compose up`
