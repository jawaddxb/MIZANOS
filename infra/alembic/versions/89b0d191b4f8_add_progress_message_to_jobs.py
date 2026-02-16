"""add_progress_message_to_jobs

Revision ID: 89b0d191b4f8
Revises: e3a4b5c6d7f8
Create Date: 2026-02-16 04:20:15.758170
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '89b0d191b4f8'
down_revision: Union[str, None] = 'e3a4b5c6d7f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('jobs', sa.Column('progress_message', sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column('jobs', 'progress_message')
