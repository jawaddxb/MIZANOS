"""restructure roles: multi-role support

Revision ID: d7f8a9b0c1e2
Revises: c91e25488264
Create Date: 2026-02-16 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = "d7f8a9b0c1e2"
down_revision: Union[str, None] = "c91e25488264"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Old roles that map to "member"
_LEGACY_ROLES = ("engineer", "bizdev", "marketing")


def upgrade() -> None:
    # 1. Add columns to user_roles
    op.add_column(
        "user_roles",
        sa.Column(
            "assigned_by",
            UUID(as_uuid=True),
            sa.ForeignKey("profiles.id"),
            nullable=True,
        ),
    )
    op.add_column(
        "user_roles",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.add_column(
        "user_roles",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # 2. Migrate legacy role values → "member" in user_roles
    for old in _LEGACY_ROLES:
        op.execute(
            f"UPDATE user_roles SET role = 'member' WHERE role = '{old}'"
        )

    # 3. Migrate legacy role values → "member" in profiles
    for old in _LEGACY_ROLES:
        op.execute(
            f"UPDATE profiles SET role = 'member' WHERE role = '{old}'"
        )

    # 4. Backfill: create user_roles rows for profiles missing them
    op.execute(
        """
        INSERT INTO user_roles (id, user_id, role, created_at, updated_at)
        SELECT gen_random_uuid(), p.user_id, p.role, now(), now()
        FROM profiles p
        WHERE p.role IS NOT NULL
          AND p.role != ''
          AND NOT EXISTS (
              SELECT 1 FROM user_roles ur
              WHERE ur.user_id = p.user_id AND ur.role = p.role
          )
        """
    )

    # 5. Deduplicate before adding constraint
    op.execute(
        """
        DELETE FROM user_roles
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, role) id
            FROM user_roles
            ORDER BY user_id, role, created_at ASC
        )
        """
    )

    # 6. Add unique constraint
    op.create_unique_constraint(
        "uq_user_roles_user_role", "user_roles", ["user_id", "role"]
    )

    # 7. Promote earliest admin (jawad@vanerchain.com) to super_admin
    op.execute(
        """
        INSERT INTO user_roles (id, user_id, role, created_at, updated_at)
        SELECT gen_random_uuid(), p.user_id, 'super_admin', now(), now()
        FROM profiles p
        WHERE p.email = 'jawad@vanerchain.com'
          AND NOT EXISTS (
              SELECT 1 FROM user_roles ur
              WHERE ur.user_id = p.user_id AND ur.role = 'super_admin'
          )
        LIMIT 1
        """
    )


def downgrade() -> None:
    # Remove super_admin rows
    op.execute("DELETE FROM user_roles WHERE role = 'super_admin'")

    # Drop unique constraint
    op.drop_constraint("uq_user_roles_user_role", "user_roles", type_="unique")

    # Drop new columns
    op.drop_column("user_roles", "updated_at")
    op.drop_column("user_roles", "created_at")
    op.drop_column("user_roles", "assigned_by")

    # Revert member → engineer in both tables
    op.execute(
        "UPDATE user_roles SET role = 'engineer' WHERE role = 'member'"
    )
    op.execute(
        "UPDATE profiles SET role = 'engineer' WHERE role = 'member'"
    )
