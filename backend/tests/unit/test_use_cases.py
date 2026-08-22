"""Unit tests for core use-cases."""

from __future__ import annotations

import pytest

from spill.core.entities.submission import (
    Category,
    ImpactLevel,
    SubmissionStatus,
)
from spill.core.use_cases.check_status import CheckStatusUseCase
from spill.core.use_cases.submit_feedback import (
    SubmitFeedbackInput,
    SubmitFeedbackUseCase,
)


class TestSubmitFeedbackUseCase:
    """Tests for the submit feedback use-case."""

    @pytest.mark.asyncio
    async def test_submit_creates_submission(self, mock_repository, mock_id_generator):
        """Submitting feedback creates a new submission and persists it."""
        use_case = SubmitFeedbackUseCase(
            repository=mock_repository,
            id_generator=mock_id_generator,
        )

        input_data = SubmitFeedbackInput(
            category=Category.COMPLAINT,
            impact=ImpactLevel.HIGH,
            encrypted_payload="encrypted_data",
            encryption_iv="iv_data",
            encrypted_symmetric_key="key_data",
            receipt_hash="b" * 64,
        )

        result = await use_case.execute(input_data)

        assert result.submission_id == "01HQTEST000000000001"
        assert result.status == SubmissionStatus.SUBMITTED
        mock_repository.save.assert_called_once()

    @pytest.mark.asyncio
    async def test_submit_calls_repository_save(self, mock_repository, mock_id_generator):
        """The repository save method is called with the correct entity."""
        use_case = SubmitFeedbackUseCase(
            repository=mock_repository,
            id_generator=mock_id_generator,
        )

        input_data = SubmitFeedbackInput(
            category=Category.SUGGESTION,
            impact=ImpactLevel.LOW,
            encrypted_payload="payload",
            encryption_iv="iv",
            encrypted_symmetric_key="key",
            receipt_hash="c" * 64,
        )

        await use_case.execute(input_data)

        saved_submission = mock_repository.save.call_args[0][0]
        assert saved_submission.category == Category.SUGGESTION
        assert saved_submission.receipt_hash == "c" * 64


class TestCheckStatusUseCase:
    """Tests for the check status use-case."""

    @pytest.mark.asyncio
    async def test_check_status_returns_empty_for_unknown_hash(self, mock_repository):
        """Unknown receipt hash returns an empty list."""
        use_case = CheckStatusUseCase(repository=mock_repository)
        mock_repository.find_by_receipt_hash.return_value = []

        results = await use_case.execute("d" * 64)

        assert results == []
        mock_repository.find_by_receipt_hash.assert_called_once_with("d" * 64)

    @pytest.mark.asyncio
    async def test_check_status_returns_submissions(
        self, mock_repository, sample_submission
    ):
        """Known receipt hash returns matching submissions."""
        mock_repository.find_by_receipt_hash.return_value = [sample_submission]
        use_case = CheckStatusUseCase(repository=mock_repository)

        results = await use_case.execute("a" * 64)

        assert len(results) == 1
        assert results[0].submission_id == sample_submission.id
        assert results[0].status == SubmissionStatus.SUBMITTED
