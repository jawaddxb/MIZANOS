"""add github_pat_id to products

Revision ID: c4f8a2b7d913
Revises: 113092e3e8ea
Create Date: 2026-02-27 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c4f8a2b7d913"
down_revision: Union[str, None] = "113092e3e8ea"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("github_pat_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_products_github_pat_id",
        "products",
        "github_pats",
        ["github_pat_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_products_github_pat_id", "products", type_="foreignkey")
    op.drop_column("products", "github_pat_id")
