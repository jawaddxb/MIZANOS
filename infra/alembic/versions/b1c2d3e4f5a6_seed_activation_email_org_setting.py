"""Seed send_activation_email_on_invite org setting.

Revision ID: b1c2d3e4f5a6
Revises: a0b1c2d3e4f5
Create Date: 2026-02-19
"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "a0b1c2d3e4f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO org_settings (id, key, value, updated_at)
        VALUES (gen_random_uuid(), 'send_activation_email_on_invite', '{"enabled": true}'::jsonb, now())
        ON CONFLICT (key) DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM org_settings WHERE key = 'send_activation_email_on_invite'"
    )
