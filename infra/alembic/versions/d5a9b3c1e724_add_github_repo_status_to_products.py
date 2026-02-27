"""add github_repo_status to products

Revision ID: d5a9b3c1e724
Revises: c4f8a2b7d913
Create Date: 2026-02-27 03:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d5a9b3c1e724"
down_revision: Union[str, None] = "c4f8a2b7d913"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("github_repo_status", sa.String(), nullable=True))
    op.add_column("products", sa.Column("github_repo_error", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "github_repo_error")
    op.drop_column("products", "github_repo_status")
