"""add tracked_branch to products

Revision ID: e6b2c4d8f135
Revises: d5a9b3c1e724
Create Date: 2026-02-27 04:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e6b2c4d8f135"
down_revision: Union[str, None] = "d5a9b3c1e724"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("tracked_branch", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "tracked_branch")
