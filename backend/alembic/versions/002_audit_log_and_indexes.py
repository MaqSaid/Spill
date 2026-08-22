"""Add audit_log table and composite indexes for performance and security.

Revision ID: 002
Revises: 001
Create Date: 2026-08-21
"""

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create audit_log table and add composite indexes."""
    # Audit log table — append-only record of admin actions
    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("action", sa.String(50), nullable=False),  # e.g., 'auth_success', 'status_change'
        sa.Column("submission_id", sa.String(26), nullable=True),  # NULL for auth events
        sa.Column("new_status", sa.String(20), nullable=True),
        sa.Column("occurred_date", sa.Date(), nullable=False),  # Date only (no timestamp precision)
        sa.Column("details", sa.String(200), nullable=False, server_default=""),
    )

    # Composite index for admin filtered queries
    op.create_index(
        "idx_submissions_status_date",
        "submissions",
        ["status", sa.text("submitted_date DESC")],
    )

    # Partial index for retention cleanup (only resolved submissions)
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_submissions_resolved_date "
        "ON submissions (submitted_date) WHERE status = 'resolved'"
    )


def downgrade() -> None:
    """Remove audit_log table and composite indexes."""
    op.execute("DROP INDEX IF EXISTS idx_submissions_resolved_date")
    op.drop_index("idx_submissions_status_date", table_name="submissions")
    op.drop_table("audit_log")
