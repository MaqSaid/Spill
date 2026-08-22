"""Submission entity — the core aggregate root for anonymous feedback."""

from __future__ import annotations

import enum
from dataclasses import dataclass, field
from datetime import UTC, date, datetime


class Category(str, enum.Enum):
    """Feedback category classification."""

    IDEA = "idea"
    COMPLAINT = "complaint"
    SUGGESTION = "suggestion"
    POSITIVE = "positive"
    WORKPLACE_CONCERN = "workplace_concern"


class ImpactLevel(str, enum.Enum):
    """Perceived impact level of the feedback."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SubmissionStatus(str, enum.Enum):
    """Lifecycle status of a submission."""

    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


@dataclass(frozen=True, slots=True)
class Submission:
    """
    Core domain entity representing an anonymous feedback submission.

    Privacy invariants:
    - `encrypted_payload` is ciphertext — server never sees plaintext.
    - `receipt_hash` is SHA-256 of the ephemeral session token — unlinkable to identity.
    - `submitted_date` is rounded to a 24-hour window (date only, no timestamp).
    - No IP, User-Agent, or identifying metadata is stored.
    """

    id: str
    category: Category
    impact: ImpactLevel
    encrypted_payload: str  # Base64-encoded AES-256-GCM ciphertext
    encryption_iv: str  # Base64-encoded initialization vector
    encrypted_symmetric_key: str  # RSA-OAEP encrypted AES key (base64)
    receipt_hash: str  # SHA-256 hex digest of session token
    status: SubmissionStatus = SubmissionStatus.SUBMITTED
    submitted_date: date = field(default_factory=lambda: datetime.now(UTC).date())
    status_note: str = ""

    def transition_status(self, new_status: SubmissionStatus, note: str = "") -> Submission:
        """Create a new Submission with updated status (immutable transition)."""
        valid_transitions: dict[SubmissionStatus, list[SubmissionStatus]] = {
            SubmissionStatus.SUBMITTED: [SubmissionStatus.UNDER_REVIEW],
            SubmissionStatus.UNDER_REVIEW: [
                SubmissionStatus.IN_PROGRESS, SubmissionStatus.RESOLVED
            ],
            SubmissionStatus.IN_PROGRESS: [SubmissionStatus.RESOLVED],
            SubmissionStatus.RESOLVED: [],
        }

        allowed = valid_transitions.get(self.status, [])
        if new_status not in allowed:
            raise ValueError(
                f"Cannot transition from {self.status.value} to {new_status.value}. "
                f"Allowed: {[s.value for s in allowed]}"
            )

        return Submission(
            id=self.id,
            category=self.category,
            impact=self.impact,
            encrypted_payload=self.encrypted_payload,
            encryption_iv=self.encryption_iv,
            encrypted_symmetric_key=self.encrypted_symmetric_key,
            receipt_hash=self.receipt_hash,
            status=new_status,
            submitted_date=self.submitted_date,
            status_note=note,
        )
