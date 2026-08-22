"""Check Status use-case — lookup submission status via receipt hash."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from spill.core.entities.submission import Category, ImpactLevel, SubmissionStatus
from spill.core.ports.repository import SubmissionRepository


@dataclass(frozen=True, slots=True)
class StatusResult:
    """Individual submission status visible to the anonymous submitter."""

    submission_id: str
    category: Category
    impact: ImpactLevel
    status: SubmissionStatus
    submitted_date: date
    status_note: str


class CheckStatusUseCase:
    """
    Retrieves submission statuses for an anonymous session.

    The receipt_hash (SHA-256 of ephemeral session token) is used
    to look up all submissions from the same browser session.
    No identity information is revealed.
    """

    def __init__(self, repository: SubmissionRepository) -> None:
        self._repository = repository

    async def execute(self, receipt_hash: str) -> list[StatusResult]:
        """Look up all submissions matching the receipt hash."""
        submissions = await self._repository.find_by_receipt_hash(receipt_hash)

        return [
            StatusResult(
                submission_id=s.id,
                category=s.category,
                impact=s.impact,
                status=s.status,
                submitted_date=s.submitted_date,
                status_note=s.status_note,
            )
            for s in submissions
        ]
