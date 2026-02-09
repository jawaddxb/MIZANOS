"""Settings models: modules, permissions, integrations, holidays, etc."""

import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class Module(Base, UUIDMixin):
    __tablename__ = "modules"

    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    docs_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scaffolding_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class FeaturePermission(Base, UUIDMixin):
    __tablename__ = "feature_permissions"

    feature_key: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    feature_name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, default="general")
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class RolePermission(Base, UUIDMixin):
    __tablename__ = "role_permissions"

    role: Mapped[str] = mapped_column(String, nullable=False)
    feature_key: Mapped[str] = mapped_column(
        String, ForeignKey("feature_permissions.feature_key"), nullable=False
    )
    can_access: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )


class PermissionAuditLog(Base, UUIDMixin):
    __tablename__ = "permission_audit_log"

    action_type: Mapped[str] = mapped_column(String, nullable=False)
    feature_key: Mapped[str] = mapped_column(String, nullable=False)
    target_role: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    target_user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    old_value: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    new_value: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    changed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class StandardsRepository(Base, UUIDMixin):
    __tablename__ = "standards_repositories"

    name: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    markdown_content: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class GlobalIntegration(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "global_integrations"

    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, default="api")
    category: Mapped[str] = mapped_column(String, default="general")
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    endpoint_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    docs_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    api_key: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    api_secret: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )


class ProjectIntegration(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "project_integrations"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    global_integration_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("global_integrations.id"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, default="api")
    category: Mapped[str] = mapped_column(String, default="general")
    status: Mapped[str] = mapped_column(String, default="active")
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    endpoint_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    docs_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    api_key_configured: Mapped[Optional[bool]] = mapped_column(
        Boolean, nullable=True
    )


class NationalHoliday(Base, UUIDMixin):
    __tablename__ = "national_holidays"

    name: Mapped[str] = mapped_column(String, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    recurring: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class TeamHoliday(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "team_holidays"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)


class ManagementNoteAccess(Base, UUIDMixin):
    __tablename__ = "management_note_access"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), unique=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
