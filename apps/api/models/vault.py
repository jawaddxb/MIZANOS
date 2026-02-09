"""Vault models: company_credentials (encrypted fields)."""

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class CompanyCredential(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "company_credentials"

    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    last_modified_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )
    linked_product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=True
    )
    label: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, default="general")
    service_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    username_encrypted: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )
    password_encrypted: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )
    email_encrypted: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    api_secret_encrypted: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )
    notes_encrypted: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tags: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String), nullable=True
    )
