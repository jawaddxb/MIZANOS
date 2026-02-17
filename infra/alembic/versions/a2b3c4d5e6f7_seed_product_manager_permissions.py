"""seed product_manager role permissions

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-02-17 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a2b3c4d5e6f7"
down_revision: Union[str, None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_ROLE = "product_manager"
_GRANTED_KEYS = ("intake_access", "project_overview")


def upgrade() -> None:
    for key in _GRANTED_KEYS:
        op.execute(
            f"""
            INSERT INTO role_permissions (id, role, feature_key, can_access, updated_at)
            SELECT gen_random_uuid(), '{_ROLE}', '{key}', true, now()
            WHERE EXISTS (
                SELECT 1 FROM feature_permissions WHERE feature_key = '{key}'
            )
            AND NOT EXISTS (
                SELECT 1 FROM role_permissions
                WHERE role = '{_ROLE}' AND feature_key = '{key}'
            )
            """
        )


def downgrade() -> None:
    op.execute(
        f"DELETE FROM role_permissions WHERE role = '{_ROLE}'"
    )
