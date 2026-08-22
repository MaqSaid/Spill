"""Audit log model — append-only record of admin actions.

This table records:
- Authentication events (success/failure — NO tokens logged)
- Status change events (submission_id + new_status)
- System events (maintenance mode, lockdown)

NEVER stores: encrypted content, receipt hashes, tokens, TOTP codes
"""

from __future__ import annotations

from datetime import UTC, date, datetime

from sqlalchemy import Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from spill.adapters.db.models import Base


class AuditLogModel(Base):
    """Append-only audit log entry."""

    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    submission_id: Mapped[str | None] = mapped_column(String(26), nullable=True)
    new_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    occurred_date: Mapped[date] = mapped_column(
        Date, nullable=False, default=lambda: datetime.now(UTC).date()
    )
    details: Mapped[str] = mapped_column(String(200), nullable=False, default="")
