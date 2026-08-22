"""Manage Submissions use-case — admin operations on submissions."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from spill.core.entities.submission import (
    Category,
    ImpactLevel,
    Submission,
    SubmissionStatus,
)
from spill.core.ports.repository import SubmissionRepository


@dataclass(frozen=True, slots=True)
class SubmissionDetail:
    """Full submission detail for admin view (still encrypted)."""

    id: str
    category: Category
    impact: ImpactLevel
    encrypted_payload: str
    encryption_iv: str
    encrypted_symmetric_key: str
    status: SubmissionStatus
    submitted_date: date
    status_note: str


@dataclass(frozen=True, slots=True)
class PaginatedSubmissions:
    """Paginated list of submissions for admin view."""

    items: list[SubmissionDetail]
    total: int
    limit: int
    offset: int


class ManageSubmissionsUseCase:
    """
    Admin operations: list submissions, update status.

    Note: The admin receives encrypted payloads — decryption
    happens client-side in the management portal using a private key.
    """

    def __init__(self, repository: SubmissionRepository) -> None:
        self._repository = repository

    async def list_submissions(
        self, limit: int = 50, offset: int = 0
    ) -> PaginatedSubmissions:
        """List all submissions (paginated) for admin review."""
        submissions = await self._repository.list_all(limit=limit, offset=offset)
        total = await self._repository.count_all()

        items = [self._to_detail(s) for s in submissions]
        return PaginatedSubmissions(
            items=items, total=total, limit=limit, offset=offset
        )

    async def update_status(
        self, submission_id: str, new_status: SubmissionStatus, note: str = ""
    ) -> SubmissionDetail | None:
        """
        Transition a submission's status.

        Validates the state machine transition before persisting.
        """
        existing = await self._repository.find_by_id(submission_id)
        if existing is None:
            return None

        # Domain entity enforces valid transitions
        transitioned = existing.transition_status(new_status, note)

        updated = await self._repository.update_status(
            submission_id, transitioned.status, transitioned.status_note
        )
        if updated is None:
            return None

        return self._to_detail(updated)

    async def get_submission(self, submission_id: str) -> SubmissionDetail | None:
        """Get a single submission by ID."""
        submission = await self._repository.find_by_id(submission_id)
        if submission is None:
            return None
        return self._to_detail(submission)

    @staticmethod
    def _to_detail(s: Submission) -> SubmissionDetail:
        return SubmissionDetail(
            id=s.id,
            category=s.category,
            impact=s.impact,
            encrypted_payload=s.encrypted_payload,
            encryption_iv=s.encryption_iv,
            encrypted_symmetric_key=s.encrypted_symmetric_key,
            status=s.status,
            submitted_date=s.submitted_date,
            status_note=s.status_note,
        )
