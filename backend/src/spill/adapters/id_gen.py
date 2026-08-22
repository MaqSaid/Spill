"""ULID ID generator adapter — implements IdGenerator port."""

from __future__ import annotations

from ulid import ULID


class UlidGenerator:
    """
    ULID-based ID generator.

    Implements: IdGenerator protocol.

    ULIDs are lexicographically sortable, timestamp-encoded unique IDs.
    The timestamp component provides ordering without revealing
    submission identity (since submitted_date is already public at day granularity).
    """

    def generate(self) -> str:
        """Generate a new ULID string."""
        return str(ULID())
