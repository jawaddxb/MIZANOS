"""Rename senior_management to business_owner in product_members and add business_owner to app roles.

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-02-18
"""

from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, None] = "c4d5e6f7a8b9"
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE product_members SET role = 'business_owner' "
        "WHERE role = 'senior_management'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE product_members SET role = 'senior_management' "
        "WHERE role = 'business_owner'"
    )
