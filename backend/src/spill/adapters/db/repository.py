"""PostgreSQL repository adapter — implements SubmissionRepository port."""

from __future__ import annotations

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from spill.adapters.db.models import SubmissionModel
from spill.core.entities.submission import Submission, SubmissionStatus


class PostgresSubmissionRepository:
    """
    Asyncpg/SQLAlchemy implementation of the SubmissionRepository port.

    Implements: SubmissionRepository protocol.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, submission: Submission) -> None:
        """Persist a new submission."""
        model = SubmissionModel(
            id=submission.id,
            category=submission.category,
            impact=submission.impact,
            encrypted_payload=submission.encrypted_payload,
            encryption_iv=submission.encryption_iv,
            encrypted_symmetric_key=submission.encrypted_symmetric_key,
            receipt_hash=submission.receipt_hash,
            status=submission.status,
            submitted_date=submission.submitted_date,
            status_note=submission.status_note,
        )
        self._session.add(model)
        await self._session.commit()

    async def find_by_receipt_hash(self, receipt_hash: str) -> list[Submission]:
        """Find all submissions matching a receipt hash."""
        stmt = (
            select(SubmissionModel)
            .where(SubmissionModel.receipt_hash == receipt_hash)
            .order_by(SubmissionModel.submitted_date.desc())
        )
        result = await self._session.execute(stmt)
        rows = result.scalars().all()
        return [self._to_entity(row) for row in rows]

    async def find_by_id(self, submission_id: str) -> Submission | None:
        """Find a single submission by ID."""
        stmt = select(SubmissionModel).where(SubmissionModel.id == submission_id)
        result = await self._session.execute(stmt)
        row = result.scalar_one_or_none()
        return self._to_entity(row) if row else None

    async def update_status(
        self, submission_id: str, status: SubmissionStatus, note: str = ""
    ) -> Submission | None:
        """Update submission status and note."""
        stmt = (
            update(SubmissionModel)
            .where(SubmissionModel.id == submission_id)
            .values(status=status, status_note=note)
        )
        await self._session.execute(stmt)
        await self._session.commit()
        return await self.find_by_id(submission_id)

    async def list_all(self, limit: int = 50, offset: int = 0) -> list[Submission]:
        """List submissions with pagination."""
        stmt = (
            select(SubmissionModel)
            .order_by(SubmissionModel.submitted_date.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        rows = result.scalars().all()
        return [self._to_entity(row) for row in rows]

    async def count_all(self) -> int:
        """Count total submissions."""
        stmt = select(func.count()).select_from(SubmissionModel)
        result = await self._session.execute(stmt)
        return result.scalar_one()

    @staticmethod
    def _to_entity(model: SubmissionModel) -> Submission:
        """Map ORM model to domain entity."""
        return Submission(
            id=model.id,
            category=model.category,
            impact=model.impact,
            encrypted_payload=model.encrypted_payload,
            encryption_iv=model.encryption_iv,
            encrypted_symmetric_key=model.encrypted_symmetric_key,
            receipt_hash=model.receipt_hash,
            status=model.status,
            submitted_date=model.submitted_date,
            status_note=model.status_note,
        )
