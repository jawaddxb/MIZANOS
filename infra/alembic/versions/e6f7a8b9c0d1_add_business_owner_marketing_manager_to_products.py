"""Add business_owner_id and marketing_manager_id to products.

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-02-18
"""

from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "e6f7a8b9c0d1"
down_revision: Union[str, None] = "d5e6f7a8b9c0"
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("business_owner_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("marketing_manager_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_products_business_owner_id",
        "products",
        "profiles",
        ["business_owner_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_products_marketing_manager_id",
        "products",
        "profiles",
        ["marketing_manager_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_products_marketing_manager_id", "products", type_="foreignkey")
    op.drop_constraint("fk_products_business_owner_id", "products", type_="foreignkey")
    op.drop_column("products", "marketing_manager_id")
    op.drop_column("products", "business_owner_id")
