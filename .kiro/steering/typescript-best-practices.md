---
title: TypeScript Best Practices
inclusion: fileMatch
fileMatchPattern: "*.ts,*.tsx"
---

# TypeScript Best Practices

## Code Style
- Use strict TypeScript configuration (`strict: true`)
- Prefer `const` over `let`, never use `var`
- Use meaningful variable and function names
- Use PascalCase for classes and interfaces
- Use camelCase for variables and functions
- Use UPPER_SNAKE_CASE for constants
- Always define return types for functions

## Type Safety
- Use union types instead of `any` — prefer `unknown` with type guards
- Prefer `interface` over `type` for object shapes
- Use generic types for reusable components
- Enable `noImplicitAny` and `strictNullChecks`
- Use branded types for domain identifiers (e.g., `SubmissionId`, `ReceiptHash`)
- Use discriminated unions for state machines

## Error Handling
- Use Result/Either patterns for error handling where appropriate
- Prefer throwing typed errors over generic Error
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Never swallow errors silently — always log or re-throw

## Imports/Exports
- Use named exports over default exports for better tree-shaking
- Group imports: external libraries first, then internal modules
- Use absolute imports with path mapping when possible
- Remove unused imports (enforced by ESLint)

## Async Patterns
- Always handle promise rejections
- Prefer `async/await` over `.then()` chains
- Use `Promise.all()` for independent concurrent operations
- Never use `any` for catch block errors — use `unknown`

## Testing
- Write unit tests for all public functions
- Use descriptive test names that explain intent
- Mock external dependencies
- Run tests with minimal verbosity: `vitest run --silent`
- Use grep/filter options to run specific tests when debugging
