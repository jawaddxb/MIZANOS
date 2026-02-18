"""User-related models: profiles, roles, permissions, preferences, github, tokens."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from packages.common.db.base import Base, TimestampMixin, UUIDMixin

from .enums import AppRole


class Profile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "profiles"

    user_id: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    availability: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    current_projects: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_projects: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    office_location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    skills: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String), nullable=True
    )
    must_reset_password: Mapped[Optional[bool]] = mapped_column(
        Boolean, nullable=True
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    invited_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    invited_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id"),
        nullable=True,
    )
    reports_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)


class UserRole(Base, UUIDMixin):
    __tablename__ = "user_roles"

    user_id: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    assigned_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class UserPermissionOverride(Base, UUIDMixin):
    __tablename__ = "user_permission_overrides"

    user_id: Mapped[str] = mapped_column(String, nullable=False)
    feature_key: Mapped[str] = mapped_column(
        String, ForeignKey("feature_permissions.feature_key"), nullable=False
    )
    override_type: Mapped[str] = mapped_column(String, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )


class UserNotificationPreference(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_notification_preferences"

    user_id: Mapped[str] = mapped_column(String, nullable=False)
    task_assignment: Mapped[bool] = mapped_column(Boolean, default=True)
    status_changes: Mapped[bool] = mapped_column(Boolean, default=True)
    deadline_reminders: Mapped[bool] = mapped_column(Boolean, default=True)
    audit_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    critical_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    email_digest: Mapped[bool] = mapped_column(Boolean, default=True)


class UserGithubConnection(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_github_connections"

    user_id: Mapped[str] = mapped_column(String, nullable=False)
    github_user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    github_username: Mapped[str] = mapped_column(String, nullable=False)
    github_avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    access_token: Mapped[str] = mapped_column(String, nullable=False)
    token_scope: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    connected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class InvitationToken(Base, UUIDMixin):
    __tablename__ = "invitation_tokens"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"),
    )
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )


class PasswordResetToken(Base, UUIDMixin):
    __tablename__ = "password_reset_tokens"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"),
    )
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
