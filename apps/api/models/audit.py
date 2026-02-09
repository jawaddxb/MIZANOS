"""Audit models: audits, repo_scan_history, repository_analyses."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, UUIDMixin


class Audit(Base, UUIDMixin):
    __tablename__ = "audits"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )
    overall_score: Mapped[float] = mapped_column(Float, default=0)
    categories: Mapped[dict] = mapped_column(JSONB, default=dict)
    issues: Mapped[dict] = mapped_column(JSONB, default=dict)
    run_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class RepoScanHistory(Base, UUIDMixin):
    __tablename__ = "repo_scan_history"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    repository_url: Mapped[str] = mapped_column(String, nullable=False)
    branch: Mapped[str] = mapped_column(String, default="main")
    latest_commit_sha: Mapped[str] = mapped_column(String, nullable=False)
    previous_commit_sha: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )
    scan_status: Mapped[str] = mapped_column(String, default="pending")
    files_changed: Mapped[int] = mapped_column(Integer, default=0)
    lines_added: Mapped[int] = mapped_column(Integer, default=0)
    lines_removed: Mapped[int] = mapped_column(Integer, default=0)
    files_added: Mapped[dict] = mapped_column(JSONB, default=list)
    files_modified: Mapped[dict] = mapped_column(JSONB, default=list)
    files_removed: Mapped[dict] = mapped_column(JSONB, default=list)
    components_discovered: Mapped[dict] = mapped_column(JSONB, default=list)
    diff_summary: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class RepositoryAnalysis(Base, UUIDMixin):
    __tablename__ = "repository_analyses"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    repository_url: Mapped[str] = mapped_column(String, nullable=False)
    branch: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    file_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    overall_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tech_stack: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    structure_map: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    functional_inventory: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True
    )
    code_critique: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    standards_compliance: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True
    )
    gap_analysis: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
