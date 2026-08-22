"""Shared test fixtures for the Spill backend."""

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


@pytest.fixture
def sample_submission() -> Submission:
    """A sample submission for testing."""
    return Submission(
        id="01HQEXAMPLE00000001",
        category=Category.IDEA,
        impact=ImpactLevel.MEDIUM,
        encrypted_payload="base64encryptedpayloaddata==",
        encryption_iv="base64iv12345678==",
        encrypted_symmetric_key="base64rsaencryptedkey==",
        receipt_hash="a" * 64,
        status=SubmissionStatus.SUBMITTED,
        submitted_date=date(2024, 1, 15),
    )


@pytest.fixture
def mock_repository() -> AsyncMock:
    """A mock repository for unit testing use-cases."""
    repo = AsyncMock()
    repo.save = AsyncMock(return_value=None)
    repo.find_by_receipt_hash = AsyncMock(return_value=[])
    repo.find_by_id = AsyncMock(return_value=None)
    repo.update_status = AsyncMock(return_value=None)
    repo.list_all = AsyncMock(return_value=[])
    repo.count_all = AsyncMock(return_value=0)
    return repo


@pytest.fixture
def mock_id_generator() -> AsyncMock:
    """A mock ID generator for unit testing."""
    gen = AsyncMock()
    gen.generate = lambda: "01HQTEST000000000001"
    return gen
