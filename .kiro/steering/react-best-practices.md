---
title: React Best Practices
inclusion: fileMatch
fileMatchPattern: "*.tsx,*.jsx"
---

# React Best Practices

## Component Structure
- Use functional components with hooks exclusively
- Keep components small and focused (single responsibility)
- Use TypeScript for all React components with strict typing
- Prefer named exports over default exports
- One component per file; colocate related utils

## Hooks
- Use `useState` for local component state
- Use `useEffect` for side effects (API calls, subscriptions)
- Use `useMemo` and `useCallback` for expensive computations and stable references
- Create custom hooks for reusable logic (prefix with `use`)
- Follow rules of hooks — only call at top level of components/hooks

## Props and State
- Define prop types with TypeScript interfaces
- Use destructuring for props in function signatures
- Avoid deeply nested state — prefer flat state or useReducer
- Lift state up only when multiple components need it
- Use state updater functions for state derived from previous state

## Performance
- Use `React.memo()` only for expensive components that re-render with same props
- Implement proper `key` props for lists (never use index for dynamic lists)
- Avoid creating objects/functions/arrays inline in JSX
- Use lazy loading (`React.lazy`) for route-level code splitting
- Avoid unnecessary re-renders by stabilizing callback references

## Accessibility (WCAG 2.1 AA)
- Use semantic HTML elements (`button`, `nav`, `main`, `section`)
- Add `aria-label` and `aria-live` for dynamic content
- Ensure all interactive elements are keyboard-accessible
- Use `role` attributes where semantic HTML is insufficient
- Maintain 4.5:1 contrast ratio for text
- Test with screen readers

## Styling
- Use Tailwind CSS utility classes exclusively (no CSS modules)
- Use consistent spacing scale and color tokens
- Implement responsive design with Tailwind breakpoints
- Avoid inline styles for anything complex

## Testing
- Test component behavior, not implementation
- Use React Testing Library (query by role, label, text)
- Test user interactions and accessibility
- Mock API calls and services at the boundary
