"""GitHub Personal Access Token model."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class GitHubPat(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "github_pats"
    __table_args__ = (
        UniqueConstraint("created_by", "token_hash", name="uq_github_pats_user_token"),
    )

    label: Mapped[str] = mapped_column(String, nullable=False)
    token_encrypted: Mapped[str] = mapped_column(String, nullable=False)
    token_hash: Mapped[str] = mapped_column(String, nullable=False)
    github_username: Mapped[str] = mapped_column(String, nullable=False)
    github_avatar_url: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )
    github_user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    scopes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    token_status: Mapped[str] = mapped_column(
        String, default="valid", server_default="valid", nullable=False
    )
