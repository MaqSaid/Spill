# ADR-001: Hexagonal Architecture (Ports and Adapters)

## Status

Accepted

## Context

Spill handles sensitive encrypted employee feedback. The application needs clear boundaries between business logic and infrastructure to enable:

- Testability without databases or HTTP frameworks
- Swappable infrastructure (e.g., switching from PostgreSQL to another store)
- Enforcement of the zero-knowledge privacy contract at the architecture level

## Decision

Adopt Hexagonal Architecture with three layers:

1. **Core Domain** (`core/`) — Entities, use cases, and port protocols. Zero framework imports.
2. **Driving Adapters** (`adapters/api/`) — FastAPI routers that translate HTTP to use-case calls.
3. **Driven Adapters** (`adapters/db/`) — PostgreSQL repository implementing the repository port.

Dependencies flow inward: adapters depend on core, core depends on nothing external.

## Consequences

- **Positive**: Use cases are testable with simple mocks. The domain enforces state machine transitions regardless of how it's accessed. The privacy contract (no plaintext on server) is verifiable by inspecting core entities alone.
- **Positive**: Infrastructure can be replaced without touching business logic (e.g., swap PostgreSQL for DynamoDB by implementing a new adapter).
- **Negative**: More files and indirection than a flat FastAPI app. For a small app, this may feel like over-engineering.
- **Accepted tradeoff**: The additional structure is justified by the security-critical nature of the application and the need for comprehensive testing.
