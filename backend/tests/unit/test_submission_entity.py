"""Unit tests for the Submission domain entity."""

from datetime import date

import pytest

from spill.core.entities.submission import (
    Category,
    ImpactLevel,
    Submission,
    SubmissionStatus,
)


class TestSubmissionEntity:
    """Tests for Submission entity creation and state transitions."""

    def test_create_submission(self):
        """A valid submission can be created with all required fields."""
        submission = Submission(
            id="01HQTEST000000000001",
            category=Category.IDEA,
            impact=ImpactLevel.HIGH,
            encrypted_payload="encrypted_data_here",
            encryption_iv="iv_data_here",
            encrypted_symmetric_key="key_data_here",
            receipt_hash="a" * 64,
        )

        assert submission.id == "01HQTEST000000000001"
        assert submission.category == Category.IDEA
        assert submission.impact == ImpactLevel.HIGH
        assert submission.status == SubmissionStatus.SUBMITTED
        assert isinstance(submission.submitted_date, date)

    def test_valid_transition_submitted_to_under_review(self, sample_submission):
        """Submitted → Under Review is a valid transition."""
        new = sample_submission.transition_status(SubmissionStatus.UNDER_REVIEW)
        assert new.status == SubmissionStatus.UNDER_REVIEW
        assert new.id == sample_submission.id

    def test_valid_transition_under_review_to_in_progress(self, sample_submission):
        """Under Review → In Progress is valid."""
        reviewed = sample_submission.transition_status(SubmissionStatus.UNDER_REVIEW)
        in_progress = reviewed.transition_status(SubmissionStatus.IN_PROGRESS)
        assert in_progress.status == SubmissionStatus.IN_PROGRESS

    def test_valid_transition_under_review_to_resolved(self, sample_submission):
        """Under Review → Resolved is valid."""
        reviewed = sample_submission.transition_status(SubmissionStatus.UNDER_REVIEW)
        resolved = reviewed.transition_status(
            SubmissionStatus.RESOLVED, "Issue addressed"
        )
        assert resolved.status == SubmissionStatus.RESOLVED
        assert resolved.status_note == "Issue addressed"

    def test_invalid_transition_submitted_to_resolved(self, sample_submission):
        """Submitted → Resolved is NOT valid (must go through review)."""
        with pytest.raises(ValueError, match="Cannot transition"):
            sample_submission.transition_status(SubmissionStatus.RESOLVED)

    def test_invalid_transition_submitted_to_in_progress(self, sample_submission):
        """Submitted → In Progress is NOT valid."""
        with pytest.raises(ValueError, match="Cannot transition"):
            sample_submission.transition_status(SubmissionStatus.IN_PROGRESS)

    def test_invalid_transition_resolved_to_anything(self, sample_submission):
        """Resolved is a terminal state — no transitions allowed."""
        reviewed = sample_submission.transition_status(SubmissionStatus.UNDER_REVIEW)
        resolved = reviewed.transition_status(SubmissionStatus.RESOLVED)

        with pytest.raises(ValueError, match="Cannot transition"):
            resolved.transition_status(SubmissionStatus.SUBMITTED)

    def test_submission_is_immutable(self, sample_submission):
        """Submissions are frozen dataclasses — attributes cannot be mutated."""
        with pytest.raises(AttributeError):
            sample_submission.status = SubmissionStatus.RESOLVED  # type: ignore
