"""add unique constraint on profiles email

Revision ID: c91e25488264
Revises: cf6ed5f4332d
Create Date: 2026-02-16 02:28:58.279873
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c91e25488264'
down_revision: Union[str, None] = 'cf6ed5f4332d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint('uq_profiles_email', 'profiles', ['email'])


def downgrade() -> None:
    op.drop_constraint('uq_profiles_email', 'profiles', type_='unique')
