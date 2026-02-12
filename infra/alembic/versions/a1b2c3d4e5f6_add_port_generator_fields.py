"""add port generator fields and system documents table

Revision ID: a1b2c3d4e5f6
Revises: 85be54c5af5c
Create Date: 2026-02-10 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "85be54c5af5c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to tasks table
    op.add_column("tasks", sa.Column("sort_order", sa.Integer(), nullable=True))
    op.add_column("tasks", sa.Column("estimated_hours", sa.Float(), nullable=True))
    op.add_column("tasks", sa.Column("generation_source", sa.String(), nullable=True))
    op.add_column("tasks", sa.Column("claude_code_prompt", sa.Text(), nullable=True))
    op.add_column("tasks", sa.Column("domain_group", sa.String(), nullable=True))
    op.add_column("tasks", sa.Column("phase", sa.String(), nullable=True))

    # Create system_documents table
    op.create_table(
        "system_documents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("doc_type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("generation_source", sa.String(), nullable=True),
        sa.Column("source_metadata", postgresql.JSON(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("generated_by", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["generated_by"], ["profiles.id"]),
    )
    op.create_index(
        "ix_system_documents_product_doc_type",
        "system_documents",
        ["product_id", "doc_type"],
    )


def downgrade() -> None:
    op.drop_index("ix_system_documents_product_doc_type", table_name="system_documents")
    op.drop_table("system_documents")
    op.drop_column("tasks", "phase")
    op.drop_column("tasks", "domain_group")
    op.drop_column("tasks", "claude_code_prompt")
    op.drop_column("tasks", "generation_source")
    op.drop_column("tasks", "estimated_hours")
    op.drop_column("tasks", "sort_order")
