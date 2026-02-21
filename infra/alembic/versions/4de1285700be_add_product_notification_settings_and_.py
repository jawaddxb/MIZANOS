"""add product_notification_settings and task_comments tables

Revision ID: 4de1285700be
Revises: c3d4e5f6a7b8
Create Date: 2026-02-21 18:22:06.850692
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '4de1285700be'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('product_notification_settings',
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('email_enabled', sa.Boolean(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('product_id')
    )
    op.create_table('task_comments',
    sa.Column('task_id', sa.UUID(), nullable=False),
    sa.Column('author_id', sa.UUID(), nullable=False),
    sa.Column('content', sa.String(), nullable=False),
    sa.Column('parent_id', sa.UUID(), nullable=True),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['author_id'], ['profiles.id'], ),
    sa.ForeignKeyConstraint(['parent_id'], ['task_comments.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_task_comments_parent_id'), 'task_comments', ['parent_id'], unique=False)
    op.create_index(op.f('ix_task_comments_task_id'), 'task_comments', ['task_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_task_comments_task_id'), table_name='task_comments')
    op.drop_index(op.f('ix_task_comments_parent_id'), table_name='task_comments')
    op.drop_table('task_comments')
    op.drop_table('product_notification_settings')
