"""Task checklist item model."""

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class TaskChecklistItem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "task_checklist_items"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    is_checked: Mapped[bool] = mapped_column(Boolean, default=False)
    assignee_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    assignee: Mapped[Optional["Profile"]] = relationship(
        "Profile", foreign_keys=[assignee_id], lazy="selectin",
    )
