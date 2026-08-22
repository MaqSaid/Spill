"""SQLAlchemy ORM models for the submissions table."""

from __future__ import annotations

from datetime import date

from sqlalchemy import Date, Enum, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from spill.core.entities.submission import Category, ImpactLevel, SubmissionStatus


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all Spill models."""

    pass


class SubmissionModel(Base):
    """
    Submissions table — stores only encrypted, anonymized data.

    Privacy guarantees at the schema level:
    - No user_id, email, or identity columns exist.
    - No precise timestamps — only date-bucketed submission date.
    - encrypted_payload is opaque ciphertext.
    """

    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)  # ULID
    category: Mapped[Category] = mapped_column(
        Enum(Category, name="category_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    impact: Mapped[ImpactLevel] = mapped_column(
        Enum(ImpactLevel, name="impact_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    encrypted_payload: Mapped[str] = mapped_column(Text, nullable=False)
    encryption_iv: Mapped[str] = mapped_column(String(44), nullable=False)  # Base64 IV
    encrypted_symmetric_key: Mapped[str] = mapped_column(Text, nullable=False)
    receipt_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(
            SubmissionStatus,
            name="status_enum",
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        default=SubmissionStatus.SUBMITTED,
    )
    submitted_date: Mapped[date] = mapped_column(Date, nullable=False)
    status_note: Mapped[str] = mapped_column(Text, default="", server_default="")
