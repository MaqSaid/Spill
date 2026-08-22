"""Property-based tests using Hypothesis for core domain logic."""

from datetime import date

from hypothesis import given
from hypothesis import strategies as st

from spill.core.entities.submission import (
    Category,
    ImpactLevel,
    Submission,
    SubmissionStatus,
)

# ─── Custom Strategies ────────────────────────────────────────────────────────

categories = st.sampled_from(list(Category))
impacts = st.sampled_from(list(ImpactLevel))
statuses = st.sampled_from(list(SubmissionStatus))
receipt_hashes = st.text(
    alphabet="0123456789abcdef", min_size=64, max_size=64
)
base64_text = st.text(
    alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    min_size=1,
    max_size=500,
)


def submission_strategy():
    """Generate arbitrary valid submissions."""
    return st.builds(
        Submission,
        id=st.text(min_size=1, max_size=26),
        category=categories,
        impact=impacts,
        encrypted_payload=base64_text,
        encryption_iv=base64_text,
        encrypted_symmetric_key=base64_text,
        receipt_hash=receipt_hashes,
        status=st.just(SubmissionStatus.SUBMITTED),
        submitted_date=st.dates(
            min_value=date(2024, 1, 1), max_value=date(2030, 12, 31)
        ),
    )


# ─── Property Tests ──────────────────────────────────────────────────────────


class TestSubmissionProperties:
    """Property-based tests for submission entity invariants."""

    @given(submission_strategy())
    def test_submission_is_always_frozen(self, submission: Submission):
        """All generated submissions should be immutable."""
        try:
            submission.status = SubmissionStatus.RESOLVED  # type: ignore
            raise AssertionError("Should not be able to mutate frozen dataclass")
        except AttributeError:
            pass

    @given(submission_strategy())
    def test_transition_to_under_review_always_valid_from_submitted(
        self, submission: Submission
    ):
        """Any submitted submission can transition to under_review."""
        new = submission.transition_status(SubmissionStatus.UNDER_REVIEW)
        assert new.status == SubmissionStatus.UNDER_REVIEW
        assert new.id == submission.id
        assert new.encrypted_payload == submission.encrypted_payload

    @given(receipt_hashes)
    def test_receipt_hash_is_always_64_hex_chars(self, receipt_hash: str):
        """Receipt hashes are always 64-character hex strings."""
        assert len(receipt_hash) == 64
        assert all(c in "0123456789abcdef" for c in receipt_hash)

    @given(categories, impacts)
    def test_all_category_impact_combinations_are_valid(
        self, category: Category, impact: ImpactLevel
    ):
        """Any combination of category and impact level creates a valid submission."""
        submission = Submission(
            id="test_id",
            category=category,
            impact=impact,
            encrypted_payload="payload",
            encryption_iv="iv",
            encrypted_symmetric_key="key",
            receipt_hash="a" * 64,
        )
        assert submission.category == category
        assert submission.impact == impact


class TestTimestampBucketing:
    """Property tests for timestamp bucketing (24-hour window)."""

    @given(st.dates(min_value=date(2024, 1, 1), max_value=date(2030, 12, 31)))
    def test_submitted_date_is_always_date_not_datetime(self, d: date):
        """Submitted date should always be a date (no time component)."""
        submission = Submission(
            id="test",
            category=Category.IDEA,
            impact=ImpactLevel.LOW,
            encrypted_payload="p",
            encryption_iv="i",
            encrypted_symmetric_key="k",
            receipt_hash="f" * 64,
            submitted_date=d,
        )
        # Verify it's a date, not a datetime
        assert type(submission.submitted_date) is date
