---
title: Testing Best Practices
inclusion: always
---

# Testing Best Practices

## Test Execution
- Always run tests with minimal verbosity to prevent session timeouts
- Use `--silent` or `--quiet` flags when available
- Filter tests with grep/pattern matching for focused testing
- Avoid running full test suites in automated contexts unless necessary

## Common Test Commands
```bash
# Frontend - Vitest (silent mode)
npm test -- --silent
npx vitest run --reporter=dot

# Backend - Pytest (quiet mode)
pytest -q
python -m pytest --tb=short -q

# Filtering specific tests
npx vitest run --grep "specific test"
pytest -k "test_specific"
```

## Output Management
- Use summary reporters instead of verbose output
- Capture detailed logs only when tests fail
- Use `--bail` or `--maxfail=1` to stop on first failure during development
- Redirect verbose output to files when needed

## Test Organization
- Separate unit, integration, property-based, and e2e tests into directories
- Group related tests to enable selective running
- Use descriptive test names that explain intent and expected behavior
- Keep test files colocated with source or in parallel test directories

## Test Quality
- Test behavior, not implementation details
- Use property-based testing (Hypothesis/fast-check) for edge cases
- Mock external dependencies — never hit real APIs in unit tests
- Aim for >80% coverage on core domain logic
- Test error paths and edge cases, not just happy paths

## Performance
- Run tests in parallel when possible (`--parallel`, `--maxWorkers`)
- Use test caching mechanisms
- Mock I/O-bound operations (database, network)
- Skip slow tests in development with `@pytest.mark.slow` or `it.skip`

## CI/CD Considerations
- Use different verbosity levels for local vs CI environments
- Capture test artifacts (coverage, reports) separately from console output
- Consider splitting large test suites across multiple CI jobs
- Fail fast in CI: `--bail` or `--maxfail=3`
