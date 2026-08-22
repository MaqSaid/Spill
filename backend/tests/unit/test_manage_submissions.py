"""Unit tests for the ManageSubmissionsUseCase."""

from __future__ import annotations

from datetime import date
from unittest.mock import AsyncMock

import pytest

from spill.core.entities.submission import (
    Category,
    ImpactLevel,
    Submission,
    SubmissionStatus,
)
from spill.core.use_cases.manage_submissions import ManageSubmissionsUseCase


@pytest.fixture
def submissions_list() -> list[Submission]:
    """A list of sample submissions for pagination tests."""
    return [
        Submission(
            id=f"01HQTEST00000000000{i}",
            category=Category.IDEA,
            impact=ImpactLevel.MEDIUM,
            encrypted_payload=f"payload_{i}",
            encryption_iv=f"iv_{i}",
            encrypted_symmetric_key=f"key_{i}",
            receipt_hash="a" * 64,
            status=SubmissionStatus.SUBMITTED,
            submitted_date=date(2024, 1, 15),
        )
        for i in range(5)
    ]


@pytest.fixture
def use_case(mock_repository: AsyncMock) -> ManageSubmissionsUseCase:
    """Create a ManageSubmissionsUseCase with a mock repository."""
    return ManageSubmissionsUseCase(repository=mock_repository)


class TestListSubmissions:
    """Tests for listing submissions with pagination."""

    async def test_returns_paginated_results(
        self,
        use_case: ManageSubmissionsUseCase,
        mock_repository: AsyncMock,
        submissions_list: list[Submission],
    ) -> None:
        mock_repository.list_all.return_value = submissions_list
        mock_repository.count_all.return_value = 5

        result = await use_case.list_submissions(limit=50, offset=0)

        assert len(result.items) == 5
        assert result.total == 5
        assert result.limit == 50
        assert result.offset == 0
        mock_repository.list_all.assert_awaited_once_with(limit=50, offset=0)
        mock_repository.count_all.assert_awaited_once()

    async def test_respects_limit_and_offset(
        self,
        use_case: ManageSubmissionsUseCase,
        mock_repository: AsyncMock,
        submissions_list: list[Submission],
    ) -> None:
        mock_repository.list_all.return_value = submissions_list[:2]
        mock_repository.count_all.return_value = 5

        result = await use_case.list_submissions(limit=2, offset=3)

        assert len(result.items) == 2
        assert result.total == 5
        assert result.limit == 2
        assert result.offset == 3
        mock_repository.list_all.assert_awaited_once_with(limit=2, offset=3)

    async def test_empty_list(
        self,
        use_case: ManageSubmissionsUseCase,
        mock_repository: AsyncMock,
    ) -> None:
        mock_repository.list_all.return_value = []
        mock_repository.count_all.return_value = 0

        result = await use_case.list_submissions()

        assert len(result.items) == 0
        assert result.total == 0


class TestGetSubmission:
    """Tests for retrieving a single submission by ID."""

    async def test_returns_submission_when_found(
        self,
        use_case: ManageSubmissionsUseCase,
        mock_repository: AsyncMock,
        sample_submission: Submission,
    ) -> None:
        mock_repository.find_by_id.return_value = sample_submission

        result = await use_case.get_submission("01HQEXAMPLE00000001")

        assert result is not None
        assert result.id == sample_submission.id
        assert result.category == sample_submission.category
        assert result.encrypted_payload == sample_submission.encrypted_payload
        mock_repository.find_by_id.assert_awaited_once_with("01HQEXAMPLE00000001")

    async def test_returns_none_when_not_found(
        self,
        use_case: ManageSubmissionsUseCase,
        mock_repository: AsyncMock,
    ) -> None:
        mock_repository.find_by_id.return_value = None

        result = await use_case.get_submission("01HQNONEXIST0000000")

        assert result is None


class TestUpdateStatus:
    """Tests for status transition enforcement."""

    async def test_valid_transition_submitted_to_under_review(
        self,
        use_case: ManageSubmissionsUseCase,
        mock_repository: AsyncMock,
        sample_submission: Submission,
    ) -> None:
        mock_repository.find_by_id.return_value = sample_submission
        updated = sample_submission.transition_status(
            SubmissionStatus.UNDER_REVIEW, "Reviewing now"
        )
        mock_repository.update_status.return_value = updated

        result = await use_case.update_status(
            "01HQEXAMPLE00000001", SubmissionStatus.UNDER_REVIEW, "Reviewing now"
        )

        assert result is not None
        assert result.status == SubmissionStatus.UNDER_REVIEW
        assert result.status_note == "Reviewing now"

    async def test_valid_transition_under_review_to_in_progress(
        self,
        use_case: ManageSubmissionsUseCase,
        mock_repository: AsyncMock,
    ) -> None:
        submission = Submission(
            id="01HQTEST000000000002",
            category=Category.COMPLAINT,
            impact=ImpactLevel.HIGH,
            encrypted_payload="payload",
            encryption_iv="iv",
            encrypted_symmetric_key="key",
            receipt_hash="b" * 64,
            status=SubmissionStatus.UNDER_REVIEW,
            submitted_date=date(2024, 2, 10),
        )
        mock_repository.find_by_id.return_value = submission
        updated = submission.transition_status(SubmissionStatus.IN_PROGRESS, "Working on it")
        mock_repository.update_status.return_value = updated

        result = await use_case.update_status(
            "01HQTEST000000000002", SubmissionStatus.IN_PROGRESS, "Working on it"
        )

        assert result is not None
        assert result.status == SubmissionStatus.IN_PROGRESS

    async def test_invalid_transition_raises_value_error(
        self,
        use_case: ManageSubmissionsUseCase,
        mock_repository: AsyncMock,
        sample_submission: Submission,
    ) -> None:
        # sample_submission is in SUBMITTED state, cannot jump to RESOLVED
        mock_repository.find_by_id.return_value = sample_submission

        with pytest.raises(ValueError, match="Cannot transition"):
            await use_case.update_status(
                "01HQEXAMPLE00000001", SubmissionStatus.RESOLVED, "Done"
            )

    async def test_update_returns_none_for_nonexistent_submission(
        self,
        use_case: ManageSubmissionsUseCase,
        mock_repository: AsyncMock,
    ) -> None:
        mock_repository.find_by_id.return_value = None

        result = await use_case.update_status(
            "01HQNONEXIST0000000", SubmissionStatus.UNDER_REVIEW, ""
        )

        assert result is None

    async def test_terminal_state_cannot_transition(
        self,
        use_case: ManageSubmissionsUseCase,
        mock_repository: AsyncMock,
    ) -> None:
        resolved_submission = Submission(
            id="01HQTEST000000000003",
            category=Category.POSITIVE,
            impact=ImpactLevel.LOW,
            encrypted_payload="payload",
            encryption_iv="iv",
            encrypted_symmetric_key="key",
            receipt_hash="c" * 64,
            status=SubmissionStatus.RESOLVED,
            submitted_date=date(2024, 3, 5),
            status_note="Completed",
        )
        mock_repository.find_by_id.return_value = resolved_submission

        with pytest.raises(ValueError, match="Cannot transition"):
            await use_case.update_status(
                "01HQTEST000000000003", SubmissionStatus.UNDER_REVIEW, ""
            )
