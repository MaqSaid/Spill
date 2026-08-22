# ADR-004: ULID Over UUID for Submission IDs

## Status

Accepted

## Context

Submissions need unique identifiers. The options considered were:
- **UUID v4**: Random, widely supported, but not sortable
- **UUID v7**: Time-sortable, but encodes millisecond-precision timestamps
- **ULID**: Lexicographically sortable, 128-bit, encodes time at millisecond precision but only in the ID itself

## Decision

Use ULIDs (Universally Unique Lexicographically Sortable Identifiers) for submission IDs.

Key properties:
- 26-character Crockford Base32 encoding
- Lexicographically sortable (useful for pagination)
- No central coordination required
- Generated server-side via the `IdGenerator` port

Privacy consideration: While ULIDs encode timestamp information, this is acceptable because:
1. The timestamp in the ULID is server-side receipt time, not submission creation time
2. The database already stores a bucketed date
3. The ULID's millisecond precision does not add meaningful correlation risk beyond what network logs would reveal (and those are purged by middleware)

## Consequences

- **Positive**: Natural sort order enables efficient cursor-based pagination without additional indexes.
- **Positive**: No database sequence or coordination needed — can be generated in-process.
- **Positive**: Compact representation (26 chars vs. 36 for UUID with dashes).
- **Negative**: Slightly less common than UUID — some tools/libraries may not natively support it.
- **Accepted tradeoff**: The sortability benefit outweighs the minor ecosystem compatibility cost.
