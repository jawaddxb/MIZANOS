"""add token_status to github_pats

Revision ID: 1fae329886d6
Revises: e6b2c4d8f135
Create Date: 2026-02-27 05:10:31.391824
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1fae329886d6'
down_revision: Union[str, None] = 'e6b2c4d8f135'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'github_pats',
        sa.Column('token_status', sa.String(), server_default='valid', nullable=False),
    )


def downgrade() -> None:
    op.drop_column('github_pats', 'token_status')
