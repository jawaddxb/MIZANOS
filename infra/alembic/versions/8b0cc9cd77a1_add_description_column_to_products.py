"""add description column to products

Revision ID: 8b0cc9cd77a1
Revises: 1243738147b8
Create Date: 2026-02-23 01:15:41.416158
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b0cc9cd77a1'
down_revision: Union[str, None] = '1243738147b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('description', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('products', 'description')
