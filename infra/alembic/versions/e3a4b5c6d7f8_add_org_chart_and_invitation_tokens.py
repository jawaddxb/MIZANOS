"""add_org_chart_and_invitation_tokens

Revision ID: e3a4b5c6d7f8
Revises: 5bb8fb7585bc
Create Date: 2026-02-16 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e3a4b5c6d7f8"
down_revision: Union[str, None] = "5bb8fb7585bc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add reports_to and title columns to profiles
    op.add_column(
        "profiles",
        sa.Column("reports_to", sa.UUID(), nullable=True),
    )
    op.add_column(
        "profiles",
        sa.Column("title", sa.String(), nullable=True),
    )
    op.create_index(op.f("ix_profiles_reports_to"), "profiles", ["reports_to"])
    op.create_foreign_key(
        "fk_profiles_reports_to",
        "profiles",
        "profiles",
        ["reports_to"],
        ["id"],
        ondelete="SET NULL",
    )

    # Create invitation_tokens table
    op.create_table(
        "invitation_tokens",
        sa.Column("profile_id", sa.UUID(), nullable=False),
        sa.Column("token", sa.String(128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["profile_id"], ["profiles.id"], ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_invitation_tokens_token"),
        "invitation_tokens",
        ["token"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_invitation_tokens_token"), table_name="invitation_tokens",
    )
    op.drop_table("invitation_tokens")
    op.drop_constraint("fk_profiles_reports_to", "profiles", type_="foreignkey")
    op.drop_index(op.f("ix_profiles_reports_to"), table_name="profiles")
    op.drop_column("profiles", "title")
    op.drop_column("profiles", "reports_to")
