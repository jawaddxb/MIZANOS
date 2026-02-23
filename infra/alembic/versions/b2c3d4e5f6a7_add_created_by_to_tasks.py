"""add created_by to tasks

Revision ID: b2c3d4e5f6a7
Revises: afb87266a015
Create Date: 2026-02-23 13:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'afb87266a015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'tasks',
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id'), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('tasks', 'created_by')
