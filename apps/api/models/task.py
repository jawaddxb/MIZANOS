"""Task-related models: tasks, task_templates."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class Task(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "tasks"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    assignee_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    priority: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pillar: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    due_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class TaskTemplate(Base, UUIDMixin):
    __tablename__ = "task_templates"

    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pillar: Mapped[str] = mapped_column(String, nullable=False)
    priority: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    default_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    order_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=True
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=True
    )
