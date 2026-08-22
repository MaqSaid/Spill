# ADR-006: No Caching By Design (Privacy Preservation)

## Status

Accepted

## Context

Caching is a standard performance optimization for web applications. Options considered:
- **CDN caching** (Cloudflare, CloudFront) for static assets and API responses
- **In-memory caching** (Redis) for frequently accessed submissions
- **Browser caching** (Cache-Control headers) for API responses
- **Database query caching** for admin listing

## Decision

Intentionally exclude all caching of dynamic content. Static assets (JS, CSS) may be cached, but API responses and submission data are never cached.

Reasons:
1. **Privacy**: Cached responses in CDN edge nodes create copies of encrypted payloads outside the database. While still encrypted, this expands the attack surface.
2. **Freshness**: Status updates must reflect immediately (SUBMITTED → UNDER_REVIEW). Cached responses would show stale status.
3. **Anonymity set**: Cache timing attacks could reduce the anonymity set. If a response is served from cache vs. origin, the timing difference reveals information about access patterns.
4. **Simplicity**: The application is lightweight enough that caching is unnecessary for the expected load (< 1000 concurrent users).

## Implementation

- No `Cache-Control` headers on API responses (defaults to `no-store`)
- No Redis or in-memory cache layer
- Static frontend assets (Vite build) use content-hash filenames for long-term caching
- Database connection pooling (SQLAlchemy async pool) handles load without caching

## Consequences

- **Positive**: No cached copies of encrypted payloads exist anywhere. Attack surface is minimal.
- **Positive**: Status updates are always real-time. No staleness issues.
- **Positive**: No cache invalidation complexity.
- **Negative**: Higher database load under heavy concurrent access. Mitigated by connection pooling and PostgreSQL's built-in query optimization.
- **Negative**: Slightly higher latency for repeated requests. Acceptable for the use case (< 200ms P95 target met without caching).
- **Accepted tradeoff**: Privacy and simplicity outweigh the marginal performance gain from caching at this scale.
