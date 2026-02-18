"""add_task_draft_fields

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-02-18 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, None] = "b3c4d5e6f7a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("is_draft", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "tasks",
        sa.Column("approved_by", sa.UUID(), nullable=True),
    )
    op.add_column(
        "tasks",
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_tasks_approved_by_profiles",
        "tasks",
        "profiles",
        ["approved_by"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_tasks_approved_by_profiles", "tasks", type_="foreignkey")
    op.drop_column("tasks", "approved_at")
    op.drop_column("tasks", "approved_by")
    op.drop_column("tasks", "is_draft")
