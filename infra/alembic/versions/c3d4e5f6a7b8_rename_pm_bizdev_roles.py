"""rename pm/product_manager to project_manager and bizdev to business_development

Revision ID: c3d4e5f6a7b8
Revises: 2b578eca0085
Create Date: 2026-02-21 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "2b578eca0085"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Merge pm + product_manager → project_manager
    for table in ("user_roles", "profiles"):
        op.execute(
            f"UPDATE {table} SET role = 'project_manager' "
            f"WHERE role IN ('pm', 'product_manager')"
        )
    op.execute(
        "UPDATE product_members SET role = 'project_manager' WHERE role = 'pm'"
    )

    # Deduplicate role_permissions before renaming (pm + product_manager may
    # share the same feature_key, causing a unique-constraint violation).
    op.execute(
        """
        DELETE FROM role_permissions
        WHERE role = 'product_manager'
          AND feature_key IN (
              SELECT feature_key FROM role_permissions WHERE role = 'pm'
          )
        """
    )
    op.execute(
        "UPDATE role_permissions SET role = 'project_manager' "
        "WHERE role IN ('pm', 'product_manager')"
    )

    # Rename stakeholder role pm → project_manager
    op.execute(
        "UPDATE project_stakeholders SET role = 'project_manager' "
        "WHERE role = 'pm'"
    )

    # 2. Rename bizdev → business_development
    for table in ("user_roles", "profiles", "role_permissions"):
        op.execute(
            f"UPDATE {table} SET role = 'business_development' "
            f"WHERE role = 'bizdev'"
        )

    # 3. Rename knowledge entry category bizdev → business_development
    op.execute(
        "UPDATE knowledge_entries SET category = 'business_development' "
        "WHERE category = 'bizdev'"
    )


def downgrade() -> None:
    # Revert project_manager → pm
    for table in ("user_roles", "profiles", "role_permissions"):
        op.execute(
            f"UPDATE {table} SET role = 'pm' "
            f"WHERE role = 'project_manager'"
        )
    op.execute(
        "UPDATE product_members SET role = 'pm' WHERE role = 'project_manager'"
    )
    op.execute(
        "UPDATE project_stakeholders SET role = 'pm' WHERE role = 'project_manager'"
    )

    # Revert business_development → bizdev
    for table in ("user_roles", "profiles", "role_permissions"):
        op.execute(
            f"UPDATE {table} SET role = 'bizdev' "
            f"WHERE role = 'business_development'"
        )
    op.execute(
        "UPDATE knowledge_entries SET category = 'bizdev' "
        "WHERE category = 'business_development'"
    )
