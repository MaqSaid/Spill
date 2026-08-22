---
inclusion: manual
---

# Skill: Development Workflows

Reusable development patterns for the Spill application. Activate this when building features.

## Adding a New Feature Checklist

1. **Check specs** — Does this feature exist in `.kiro/specs/requirements.md`?
2. **Check architecture** — Which layer does this belong in?
   - Business logic → `core/use_cases/`
   - HTTP translation → `adapters/api/routers/`
   - Data persistence → `adapters/db/`
   - Frontend service → `frontend/src/services/`
   - Frontend UI → `frontend/src/pages/` or `components/`
3. **Write the code** following layer rules
4. **Add tests** in the matching test directory
5. **Run verification** — `ruff check` + `tsc --noEmit`
6. **Run readiness check** — `pwsh -File scripts/check-submission-readiness.ps1`

## Layer Rules (Quick Reference)

### Core Domain (`backend/src/spill/core/`)
- ZERO imports from fastapi, sqlalchemy, pydantic, starlette
- Entities are `@dataclass(frozen=True, slots=True)`
- Use cases depend on Ports (typing.Protocol) only
- Business rules enforced here (state machine, validation)

### Adapters (`backend/src/spill/adapters/`)
- Routers: thin HTTP translation, no business logic
- Repository: implements the Protocol from ports
- Middleware: privacy enforcement (metadata purging)
- Dependencies: FastAPI DI wiring (Depends pattern)

### Frontend Services (`frontend/src/services/`)
- Pure functions/classes — no React dependencies
- `encryption.ts`: Web Crypto API (AES-256-GCM + RSA-OAEP)
- `session.ts`: sessionStorage only, SHA-256 hashing
- `api.ts`: fetch wrapper for backend endpoints

### Frontend Pages (`frontend/src/pages/`)
- React functional components with hooks
- Use services for logic — pages are UI only
- Tailwind CSS for styling
- ARIA labels for accessibility

## Adding a New API Endpoint

```python
# 1. Add to router (adapters/api/routers/submissions.py)
@router.post("/api/v1/new-endpoint")
async def new_endpoint(
    body: NewRequestSchema,
    use_case: MyUseCase = Depends(get_my_use_case),
) -> NewResponseSchema:
    result = await use_case.execute(body.field)
    return NewResponseSchema(...)

# 2. Add use case (core/use_cases/new_feature.py)
class MyUseCase:
    def __init__(self, repository: SubmissionRepository) -> None:
        self._repository = repository

    async def execute(self, input: str) -> Result:
        # Business logic here
        ...

# 3. Add DI wiring (adapters/api/dependencies.py)
def get_my_use_case(
    repository: PostgresSubmissionRepository = Depends(get_repository),
):
    return MyUseCase(repository=repository)

# 4. Add schemas (adapters/api/schemas.py)
class NewRequestSchema(BaseModel): ...
class NewResponseSchema(BaseModel): ...
```

## Adding a Frontend Service Function

```typescript
// 1. Add to services/api.ts
export async function newApiCall(data: RequestType): Promise<ResponseType> {
  const response = await fetch(`${API_BASE}/new-endpoint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed: ${response.status}`);
  return response.json() as Promise<ResponseType>;
}

// 2. Add interface
export interface RequestType { ... }
export interface ResponseType { ... }
```

## Common Patterns

### Error Handling (Backend)
```python
try:
    result = await use_case.execute(...)
except ValueError as e:
    raise HTTPException(status_code=422, detail=str(e)) from e
```

### State Validation (Frontend)
```typescript
const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
```

### Privacy Compliance
- Never add `console.log()` with user data in production code
- Never reference `localStorage` — always `sessionStorage`
- Never send plaintext feedback over the network
- Category and impact are the ONLY unencrypted metadata
