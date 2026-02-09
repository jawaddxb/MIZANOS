"""Vault (credentials) schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class CredentialBase(BaseSchema):
    """Credential fields (non-sensitive)."""

    label: str
    category: str = "general"
    service_name: str | None = None
    url: str | None = None
    tags: list[str] = []
    linked_product_id: UUID | None = None


class CredentialCreate(CredentialBase):
    """Credential creation with sensitive fields."""

    username: str | None = None
    email: str | None = None
    password: str | None = None
    api_secret: str | None = None
    notes: str | None = None


class CredentialUpdate(BaseSchema):
    """Credential update."""

    label: str | None = None
    category: str | None = None
    service_name: str | None = None
    url: str | None = None
    tags: list[str] | None = None
    username: str | None = None
    email: str | None = None
    password: str | None = None
    api_secret: str | None = None
    notes: str | None = None


class CredentialResponse(CredentialBase):
    """Credential response (sensitive fields decrypted on read)."""

    id: UUID
    username: str | None = None
    email: str | None = None
    password: str | None = None
    api_secret: str | None = None
    notes: str | None = None
    created_by: UUID
    last_modified_by: UUID | None = None
    created_at: datetime
    updated_at: datetime
