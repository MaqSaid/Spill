"""Domain entities — immutable value objects and aggregate roots."""

from spill.core.entities.submission import (
    Category,
    ImpactLevel,
    Submission,
    SubmissionStatus,
)

__all__ = ["Category", "ImpactLevel", "Submission", "SubmissionStatus"]
