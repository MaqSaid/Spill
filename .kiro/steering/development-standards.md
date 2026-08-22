---
title: Development Standards
inclusion: always
---

# Development Standards

## Dependency Management
- Use latest stable versions of all libraries
- Justify each new dependency with clear technical value
- Prefer well-maintained libraries with active communities
- Use lock files (package-lock.json, poetry.lock) for reproducible builds
- Remove unused dependencies regularly
- Pin exact versions in production deployments
- Run `npm audit` / `pip-audit` before merging dependency changes

## Code Quality Standards
- Never create duplicate files with suffixes like `_fixed`, `_clean`, `_backup`
- Work iteratively on existing files
- Include relevant documentation links in code comments
- Use meaningful variable and function names
- Keep functions small and focused on single responsibilities
- Implement proper error handling and logging
- Follow DRY (Don't Repeat Yourself) principle
- Prefer composition over inheritance

## File Management
- Maintain clean directory structures following hexagonal architecture
- Use consistent naming conventions across the project
- Avoid temporary or backup files in version control
- Organize code logically by feature or domain layer
- Keep configuration files at appropriate levels

## Documentation
- Maintain single comprehensive README covering setup and deployment
- Update documentation when upgrading dependencies or changing APIs
- Keep documentation close to relevant code
- Use inline comments for complex business logic only (not obvious code)
- Document API endpoints with OpenAPI/Swagger annotations
- Include architecture decision records (ADRs) for significant choices

## Version Control Integration
- Commit frequently with meaningful conventional commit messages
- Use feature branches for all development
- Keep main branch deployable at all times
- Tag releases with semantic versioning
- Use .gitignore to exclude generated files and secrets

## Performance & Efficiency
- "Shell Command = Free; Agent Prompt = Credits" — prefer shell hooks for linting/testing
- Profile before optimizing — don't prematurely optimize
- Use connection pooling for database access
- Implement pagination for list endpoints
- Cache expensive computations where safe to do so
