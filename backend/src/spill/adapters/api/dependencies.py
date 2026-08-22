"""FastAPI dependency injection — wires ports to adapters."""
# ruff: noqa: B008 — Depends() in defaults is the standard FastAPI DI pattern

from __future__ import annotations

from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from spill.adapters.db.repository import PostgresSubmissionRepository
from spill.adapters.db.session import create_engine, create_session_factory
from spill.adapters.id_gen import UlidGenerator
from spill.config.settings import get_settings

# Module-level singletons initialized lazily
_engine = None
_session_factory = None


def _get_session_factory():
    """Get or create the session factory singleton."""
    global _engine, _session_factory
    if _session_factory is None:
        settings = get_settings()
        _engine = create_engine(settings.database_url)
        _session_factory = create_session_factory(_engine)
    return _session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a database session per request."""
    factory = _get_session_factory()
    async with factory() as session:
        yield session


def get_repository(
    session: AsyncSession = Depends(get_db_session),
) -> PostgresSubmissionRepository:
    """Provide repository adapter."""
    return PostgresSubmissionRepository(session)


def get_id_generator() -> UlidGenerator:
    """Provide ID generator adapter."""
    return UlidGenerator()


def get_submit_use_case(
    repository: PostgresSubmissionRepository = Depends(get_repository),
    id_generator: UlidGenerator = Depends(get_id_generator),
):
    """Provide SubmitFeedbackUseCase with injected dependencies."""
    from spill.core.use_cases.submit_feedback import SubmitFeedbackUseCase

    return SubmitFeedbackUseCase(repository=repository, id_generator=id_generator)


def get_status_use_case(
    repository: PostgresSubmissionRepository = Depends(get_repository),
):
    """Provide CheckStatusUseCase with injected dependencies."""
    from spill.core.use_cases.check_status import CheckStatusUseCase

    return CheckStatusUseCase(repository=repository)


def get_manage_use_case(
    repository: PostgresSubmissionRepository = Depends(get_repository),
):
    """Provide ManageSubmissionsUseCase with injected dependencies."""
    from spill.core.use_cases.manage_submissions import ManageSubmissionsUseCase

    return ManageSubmissionsUseCase(repository=repository)
