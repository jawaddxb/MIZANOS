"""add_created_by_to_products

Revision ID: 09004f7c27a4
Revises: 4de1285700be
Create Date: 2026-02-22 02:41:10.249512
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '09004f7c27a4'
down_revision: Union[str, None] = '4de1285700be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('created_by', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_products_created_by', 'products', 'profiles', ['created_by'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_products_created_by', 'products', type_='foreignkey')
    op.drop_column('products', 'created_by')
