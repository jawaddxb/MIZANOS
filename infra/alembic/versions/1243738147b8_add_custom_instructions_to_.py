"""add_custom_instructions_to_specifications

Revision ID: 1243738147b8
Revises: 09004f7c27a4
Create Date: 2026-02-22 03:48:49.852946
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1243738147b8'
down_revision: Union[str, None] = '09004f7c27a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('specifications', sa.Column('custom_instructions', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('specifications', 'custom_instructions')
