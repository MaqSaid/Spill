"""Submit Feedback use-case — handles anonymous submission creation."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime

from spill.core.entities.submission import (
    Category,
    ImpactLevel,
    Submission,
    SubmissionStatus,
)
from spill.core.ports.id_generator import IdGenerator
from spill.core.ports.repository import SubmissionRepository


@dataclass(frozen=True, slots=True)
class SubmitFeedbackInput:
    """Input DTO for the submit feedback use-case."""

    category: Category
    impact: ImpactLevel
    encrypted_payload: str  # Base64-encoded AES-256-GCM ciphertext
    encryption_iv: str  # Base64-encoded IV
    encrypted_symmetric_key: str  # RSA-OAEP encrypted AES key
    receipt_hash: str  # SHA-256 hex digest of session token


@dataclass(frozen=True, slots=True)
class SubmitFeedbackOutput:
    """Output DTO for the submit feedback use-case."""

    submission_id: str
    status: SubmissionStatus
    submitted_date: date


class SubmitFeedbackUseCase:
    """
    Creates a new anonymous submission.

    Privacy guarantees enforced:
    - No identity information is accepted or stored.
    - Payload is already encrypted client-side — treated as opaque ciphertext.
    - Timestamp is bucketed to a 24-hour window (date only).
    """

    def __init__(
        self,
        repository: SubmissionRepository,
        id_generator: IdGenerator,
    ) -> None:
        self._repository = repository
        self._id_generator = id_generator

    async def execute(self, input_data: SubmitFeedbackInput) -> SubmitFeedbackOutput:
        """Execute the submission use-case."""
        submission_id = self._id_generator.generate()
        submitted_date = datetime.now(UTC).date()

        submission = Submission(
            id=submission_id,
            category=input_data.category,
            impact=input_data.impact,
            encrypted_payload=input_data.encrypted_payload,
            encryption_iv=input_data.encryption_iv,
            encrypted_symmetric_key=input_data.encrypted_symmetric_key,
            receipt_hash=input_data.receipt_hash,
            status=SubmissionStatus.SUBMITTED,
            submitted_date=submitted_date,
        )

        await self._repository.save(submission)

        return SubmitFeedbackOutput(
            submission_id=submission.id,
            status=submission.status,
            submitted_date=submission.submitted_date,
        )
