"""Project models: project_completions, project_stakeholders."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class ProjectCompletion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "project_completions"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )
    score: Mapped[float] = mapped_column(Float, default=0)
    quality_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    timeliness_rating: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )
    collaboration_rating: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )
    feedback: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role_on_project: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    skills_demonstrated: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String), nullable=True
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ProjectStakeholder(Base, UUIDMixin):
    __tablename__ = "project_stakeholders"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    profile_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_external: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    responsibilities: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String), nullable=True
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=True
    )
