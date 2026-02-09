"""Specification models: specifications, features, sources."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class Specification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "specifications"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )
    content: Mapped[dict] = mapped_column(JSONB, default=dict)
    version: Mapped[int] = mapped_column(Integer, default=1)


class SpecificationFeature(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "specification_features"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    specification_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("specifications.id"), nullable=True
    )
    task_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True
    )
    source_product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=True
    )
    source_feature_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")
    priority: Mapped[str] = mapped_column(String, default="medium")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_reusable: Mapped[bool] = mapped_column(Boolean, default=False)
    reusable_category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    github_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    acceptance_criteria: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True
    )


class SpecificationSource(Base, UUIDMixin):
    __tablename__ = "specification_sources"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    file_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    file_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    raw_content: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    transcription: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    screenshot_base64: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    ai_summary: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    branding: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    screenshots: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
