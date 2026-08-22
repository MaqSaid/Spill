"""ID generator port — protocol for generating unique identifiers."""

from __future__ import annotations

from typing import Protocol


class IdGenerator(Protocol):
    """Port for generating unique submission identifiers."""

    def generate(self) -> str:
        """Generate a new unique identifier."""
        ...
