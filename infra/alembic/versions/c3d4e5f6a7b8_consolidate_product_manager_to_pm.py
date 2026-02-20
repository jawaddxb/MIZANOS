"""consolidate_product_manager_to_pm

Revision ID: c3d4e5f6a7b8
Revises: 2b578eca0085
Create Date: 2026-02-20 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "2b578eca0085"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. profiles.role: product_manager → pm
    op.execute("UPDATE profiles SET role = 'pm' WHERE role = 'product_manager'")

    # 2. user_roles: delete conflicts first, then rename remaining
    op.execute(
        "DELETE FROM user_roles WHERE role = 'product_manager' "
        "AND user_id IN (SELECT user_id FROM user_roles WHERE role = 'pm')"
    )
    op.execute("UPDATE user_roles SET role = 'pm' WHERE role = 'product_manager'")

    # 3. role_permissions: same pattern
    op.execute(
        "DELETE FROM role_permissions WHERE role = 'product_manager' "
        "AND feature_key IN (SELECT feature_key FROM role_permissions WHERE role = 'pm')"
    )
    op.execute(
        "UPDATE role_permissions SET role = 'pm' WHERE role = 'product_manager'"
    )

    # 4. audit log
    op.execute(
        "UPDATE permission_audit_log SET target_role = 'pm' "
        "WHERE target_role = 'product_manager'"
    )


def downgrade() -> None:
    # No automated rollback — product_manager was a duplicate of pm
    pass
