"""add tasks_locked column to products

Revision ID: afb87266a015
Revises: 8b0cc9cd77a1
Create Date: 2026-02-23 03:23:24.426257
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'afb87266a015'
down_revision: Union[str, None] = '8b0cc9cd77a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'products',
        sa.Column('tasks_locked', sa.Boolean(), server_default='false', nullable=False),
    )


def downgrade() -> None:
    op.drop_column('products', 'tasks_locked')
