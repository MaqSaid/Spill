---
title: Git Best Practices
inclusion: always
---

# Git Best Practices

## Commit Messages
- Use conventional commit format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore, security
- Keep first line under 50 characters
- Use imperative mood ("Add feature" not "Added feature")
- Include body for complex changes explaining WHY
- Reference issue numbers when applicable

## Branching
- Use feature branches for new development: `feature/short-description`
- Use fix branches for bugs: `fix/brief-bug-name`
- Keep main/master branch stable and deployable
- Delete merged branches to keep repository clean
- Never force push to shared branches

## Workflow
- Pull latest changes before starting work
- Commit frequently with logical atomic chunks
- Keep PRs small and focused (< 400 lines when possible)
- Review code before merging (pull requests required)
- Squash trivial commits before merge

## Security
- Never commit secrets, API keys, private keys, or passwords
- Use environment variables for all configuration
- Run GitLeaks pre-commit hook on every commit
- Use `.gitignore` to exclude build artifacts, .env files, and secrets
- Use signed commits when possible for audit trail
- Review diffs before committing to catch accidental secret inclusion

## Repository Hygiene
- Keep repository size manageable (use Git LFS for large files)
- Tag releases with semantic versioning (v1.2.3)
- Maintain a meaningful CHANGELOG
- Document branching strategy in contributing guide
