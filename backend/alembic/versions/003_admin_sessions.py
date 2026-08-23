"""Add admin_sessions table for persistent session storage.

Revision ID: 003
Revises: 002
Create Date: 2026-08-23
"""

from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create admin_sessions table for PostgreSQL-backed session persistence."""
    op.create_table(
        "admin_sessions",
        sa.Column("session_hash", sa.String(64), primary_key=True),  # SHA-256 hex
        sa.Column("created_at", sa.Float(), nullable=False),  # Unix timestamp
        sa.Column("last_activity", sa.Float(), nullable=False),  # Unix timestamp
    )


def downgrade() -> None:
    """Drop admin_sessions table."""
    op.drop_table("admin_sessions")
