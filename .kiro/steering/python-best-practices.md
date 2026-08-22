---
title: Python Best Practices
inclusion: fileMatch
fileMatchPattern: "*.py"
---

# Python Best Practices

## Code Style
- Follow PEP 8 enforced by Ruff formatter
- Use `from __future__ import annotations` for modern type syntax
- Use snake_case for variables and functions
- Use PascalCase for classes
- Use UPPER_SNAKE_CASE for constants
- Limit line length to 100 characters (per pyproject.toml)

## Type Hints
- Type hints REQUIRED on all function parameters and return values
- Use `X | None` syntax (not `Optional[X]`) — requires `from __future__ import annotations`
- Use `typing.Protocol` for structural subtyping (ports)
- Use `@dataclass(frozen=True, slots=True)` for immutable value objects
- Run `mypy --strict` for full type checking

## Error Handling
- Use specific exception types — never bare `except:`
- Handle exceptions at appropriate levels (use-case, not adapter)
- Use context managers (`with`) for resource management
- Log errors with appropriate detail and context
- Prefer returning result types over raising for expected failures

## Code Organization (Hexagonal Architecture)
- Core domain: zero framework imports, pure Python only
- Ports: `typing.Protocol` interfaces
- Adapters: concrete implementations of ports
- Dependency injection at composition root (FastAPI Depends)
- Never import from adapters in core domain

## Testing
- Write unit tests using pytest with descriptive function names
- Use `@pytest.mark.asyncio` for async tests
- Use fixtures for test setup and dependency mocking
- Use Hypothesis for property-based testing on domain logic
- Run with minimal output: `pytest -q --tb=short`

## Async Patterns
- Use `async/await` for all I/O operations
- Never use synchronous database calls
- Use `asyncpg` via SQLAlchemy async for PostgreSQL
- Use `asyncio.gather()` for concurrent independent operations
- Always await coroutines — never fire-and-forget

## Performance
- Use list comprehensions over explicit loops where readable
- Use generators for large datasets
- Use connection pooling for database (SQLAlchemy pool_size)
- Profile before optimizing (`cProfile`, `py-spy`)
