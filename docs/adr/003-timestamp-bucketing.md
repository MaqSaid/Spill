# ADR-003: Timestamp Bucketing (Date-Only Storage)

## Status

Accepted

## Context

Precise timestamps (e.g., `2024-01-15T14:23:47.123Z`) can be used for timing correlation attacks. If an administrator knows that a particular employee sent an email at 14:23 and a feedback submission arrived at 14:24, they could correlate the two. Even second-level precision narrows the anonymity set significantly.

## Decision

Store only `DATE` (not `TIMESTAMP` or `DATETIME`) in the database. All submissions within a 24-hour window are indistinguishable by time.

Implementation:
- The `Submission` entity uses Python's `date` type (not `datetime`)
- The database column is `DATE` type
- The Alembic migration enforces this at the schema level
- The entity factory uses `datetime.now(UTC).date()` to bucket on creation

## Consequences

- **Positive**: Timing correlation attacks are defeated. An attacker cannot distinguish between submissions made at 9:00 AM and 5:00 PM on the same day.
- **Positive**: Combined with metadata purging, this makes individual submissions effectively unlinkable.
- **Negative**: Cannot determine submission ordering within a day. Admin sees "January 15" but not "morning vs. evening."
- **Negative**: Rate limiting based on time windows is coarser (can only rate-limit per day, not per minute).
- **Accepted tradeoff**: Anonymity is more important than temporal precision for this use case.
