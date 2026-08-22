"""Initial submissions table.

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "submissions",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column(
            "category",
            sa.Enum(
                "idea", "complaint", "suggestion", "positive", "workplace_concern",
                name="category_enum",
            ),
            nullable=False,
        ),
        sa.Column(
            "impact",
            sa.Enum("low", "medium", "high", "critical", name="impact_enum"),
            nullable=False,
        ),
        sa.Column("encrypted_payload", sa.Text(), nullable=False),
        sa.Column("encryption_iv", sa.String(44), nullable=False),
        sa.Column("encrypted_symmetric_key", sa.Text(), nullable=False),
        sa.Column("receipt_hash", sa.String(64), nullable=False, index=True),
        sa.Column(
            "status",
            sa.Enum(
                "submitted", "under_review", "in_progress", "resolved",
                name="status_enum",
            ),
            nullable=False,
            server_default="submitted",
        ),
        sa.Column("submitted_date", sa.Date(), nullable=False),
        sa.Column("status_note", sa.Text(), server_default=""),
    )
    op.create_index("ix_submissions_receipt_hash", "submissions", ["receipt_hash"])


def downgrade() -> None:
    op.drop_index("ix_submissions_receipt_hash")
    op.drop_table("submissions")
    op.execute("DROP TYPE IF EXISTS category_enum")
    op.execute("DROP TYPE IF EXISTS impact_enum")
    op.execute("DROP TYPE IF EXISTS status_enum")
