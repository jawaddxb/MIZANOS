"""Marketing models: checklist items/templates, credentials, domains, social handles."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class MarketingChecklistItem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "marketing_checklist_items"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_completed: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    order_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    due_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )


class MarketingChecklistTemplate(Base, UUIDMixin):
    __tablename__ = "marketing_checklist_templates"

    title: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    order_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=True
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=True
    )


class MarketingCredential(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "marketing_credentials"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    domain_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("marketing_domains.id"), nullable=True
    )
    social_handle_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("marketing_social_handles.id"),
        nullable=True,
    )
    label: Mapped[str] = mapped_column(String, nullable=False)
    credential_type: Mapped[str] = mapped_column(String, nullable=False)
    username: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    password_encrypted: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )
    additional_info: Mapped[Optional[str]] = mapped_column(String, nullable=True)


class MarketingDomain(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "marketing_domains"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    domain_name: Mapped[str] = mapped_column(String, nullable=False)
    owner_name: Mapped[str] = mapped_column(String, nullable=False)
    owner_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    registrar: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    dns_provider: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    registration_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expiry_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ssl_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_secured: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)


class MarketingSocialHandle(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "marketing_social_handles"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    registered_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    platform: Mapped[str] = mapped_column(String, nullable=False)
    handle: Mapped[str] = mapped_column(String, nullable=False)
    profile_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
