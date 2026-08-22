"""Repository port — protocol for submission persistence."""

from __future__ import annotations

from typing import Protocol

from spill.core.entities.submission import Submission, SubmissionStatus


class SubmissionRepository(Protocol):
    """Port for persisting and retrieving anonymous submissions."""

    async def save(self, submission: Submission) -> None:
        """Persist a new submission."""
        ...

    async def find_by_receipt_hash(self, receipt_hash: str) -> list[Submission]:
        """Find all submissions matching a receipt hash (session lookup)."""
        ...

    async def find_by_id(self, submission_id: str) -> Submission | None:
        """Find a single submission by its ID."""
        ...

    async def update_status(
        self, submission_id: str, status: SubmissionStatus, note: str = ""
    ) -> Submission | None:
        """Update the status of a submission. Returns updated entity or None."""
        ...

    async def list_all(self, limit: int = 50, offset: int = 0) -> list[Submission]:
        """List submissions for admin view (paginated)."""
        ...

    async def count_all(self) -> int:
        """Count total submissions."""
        ...
