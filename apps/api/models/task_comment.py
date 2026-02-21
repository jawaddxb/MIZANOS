"""Task comment model."""

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class TaskComment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "task_comments"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False,
    )
    content: Mapped[str] = mapped_column(String, nullable=False)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("task_comments.id", ondelete="CASCADE"),
        nullable=True, index=True,
    )

    author: Mapped["Profile"] = relationship(
        "Profile", foreign_keys=[author_id], lazy="selectin",
    )
    replies: Mapped[list["TaskComment"]] = relationship(
        "TaskComment",
        back_populates="parent",
        lazy="noload",
        order_by="TaskComment.created_at",
    )
    parent: Mapped[Optional["TaskComment"]] = relationship(
        "TaskComment",
        back_populates="replies",
        remote_side="TaskComment.id",
        lazy="noload",
    )
