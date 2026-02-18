"""drop_legacy_product_fk_columns

Revision ID: 2b578eca0085
Revises: b1c2d3e4f5a6
Create Date: 2026-02-19 03:30:34.190192
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '2b578eca0085'
down_revision: Union[str, None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('fk_products_marketing_manager_id', 'products', type_='foreignkey')
    op.drop_constraint('fk_products_business_owner_id', 'products', type_='foreignkey')
    op.drop_constraint('products_engineer_id_fkey', 'products', type_='foreignkey')
    op.drop_constraint('products_pm_id_fkey', 'products', type_='foreignkey')
    op.drop_column('products', 'marketing_manager_id')
    op.drop_column('products', 'pm_id')
    op.drop_column('products', 'engineer_id')
    op.drop_column('products', 'business_owner_id')


def downgrade() -> None:
    op.add_column('products', sa.Column('business_owner_id', sa.UUID(), nullable=True))
    op.add_column('products', sa.Column('engineer_id', sa.UUID(), nullable=True))
    op.add_column('products', sa.Column('pm_id', sa.UUID(), nullable=True))
    op.add_column('products', sa.Column('marketing_manager_id', sa.UUID(), nullable=True))
    op.create_foreign_key('products_pm_id_fkey', 'products', 'profiles', ['pm_id'], ['id'])
    op.create_foreign_key('products_engineer_id_fkey', 'products', 'profiles', ['engineer_id'], ['id'])
    op.create_foreign_key('fk_products_business_owner_id', 'products', 'profiles', ['business_owner_id'], ['id'])
    op.create_foreign_key('fk_products_marketing_manager_id', 'products', 'profiles', ['marketing_manager_id'], ['id'])
