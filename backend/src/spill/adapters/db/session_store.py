"""PostgreSQL-backed admin session store.

Replaces in-memory session dict with database persistence so sessions
survive container restarts. Stores only SHA-256(session_token) — never
the raw token.
"""

from __future__ import annotations

import time

from sqlalchemy import Column, Float, String, delete, select, update
from sqlalchemy.orm import DeclarativeBase


class _Base(DeclarativeBase):
    pass


class AdminSessionModel(_Base):
    """SQLAlchemy model for admin_sessions table."""

    __tablename__ = "admin_sessions"

    session_hash: str = Column(String(64), primary_key=True)  # type: ignore[assignment]
    created_at: float = Column(Float, nullable=False)  # type: ignore[assignment]
    last_activity: float = Column(Float, nullable=False)  # type: ignore[assignment]


class PostgresSessionStore:
    """
    Persistent session store using PostgreSQL.

    Security properties:
    - Only SHA-256 hashes of session tokens are stored (never raw tokens)
    - Expired sessions are cleaned on validation
    - No identity metadata stored alongside sessions
    """

    def __init__(self, session_factory, *, session_ttl: int = 28800, idle_ttl: int = 1800) -> None:
        self._session_factory = session_factory
        self._session_ttl = session_ttl
        self._idle_ttl = idle_ttl

    async def create(self, session_hash: str) -> None:
        """Store a new session hash."""
        now = time.time()
        async with self._session_factory() as db:
            db.add(AdminSessionModel(
                session_hash=session_hash,
                created_at=now,
                last_activity=now,
            ))
            await db.commit()

    async def validate(self, session_hash: str) -> bool:
        """Validate session: check existence + TTL + idle timeout."""
        now = time.time()
        async with self._session_factory() as db:
            result = await db.execute(
                select(AdminSessionModel).where(
                    AdminSessionModel.session_hash == session_hash
                )
            )
            session = result.scalar_one_or_none()

            if session is None:
                return False

            # Check absolute timeout
            if now - session.created_at > self._session_ttl:
                await db.execute(
                    delete(AdminSessionModel).where(
                        AdminSessionModel.session_hash == session_hash
                    )
                )
                await db.commit()
                return False

            # Check idle timeout
            if now - session.last_activity > self._idle_ttl:
                await db.execute(
                    delete(AdminSessionModel).where(
                        AdminSessionModel.session_hash == session_hash
                    )
                )
                await db.commit()
                return False

            # Update last activity
            await db.execute(
                update(AdminSessionModel)
                .where(AdminSessionModel.session_hash == session_hash)
                .values(last_activity=now)
            )
            await db.commit()
            return True

    async def invalidate(self, session_hash: str) -> None:
        """Remove a specific session."""
        async with self._session_factory() as db:
            await db.execute(
                delete(AdminSessionModel).where(
                    AdminSessionModel.session_hash == session_hash
                )
            )
            await db.commit()

    async def invalidate_all(self) -> None:
        """Remove all sessions (emergency/rotation)."""
        async with self._session_factory() as db:
            await db.execute(delete(AdminSessionModel))
            await db.commit()
