"""Marketing schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class DomainBase(BaseSchema):
    """Marketing domain fields."""

    domain_name: str
    registrar: str | None = None
    expiry_date: datetime | None = None
    ssl_status: str | None = None
    dns_provider: str | None = None


class DomainCreate(DomainBase):
    """Domain creation."""

    product_id: UUID


class DomainResponse(DomainBase):
    """Domain response."""

    id: UUID
    product_id: UUID
    created_at: datetime


class SocialHandleBase(BaseSchema):
    """Social media handle fields."""

    platform: str
    handle: str
    url: str | None = None
    status: str = "active"


class SocialHandleCreate(SocialHandleBase):
    """Social handle creation."""

    product_id: UUID


class SocialHandleResponse(SocialHandleBase):
    """Social handle response."""

    id: UUID
    product_id: UUID
    created_at: datetime


class ChecklistItemBase(BaseSchema):
    """Marketing checklist item fields."""

    category: str
    title: str
    description: str | None = None
    is_completed: bool = False
    sort_order: int = 0


class ChecklistItemCreate(ChecklistItemBase):
    """Checklist item creation."""

    product_id: UUID


class ChecklistItemResponse(ChecklistItemBase):
    """Checklist item response."""

    id: UUID
    product_id: UUID
    created_at: datetime


class CredentialCreate(BaseSchema):
    """Marketing credential creation."""

    product_id: UUID
    created_by: UUID
    label: str
    credential_type: str
    username: str | None = None
    email: str | None = None
    password: str | None = None
    additional_info: str | None = None
    domain_id: UUID | None = None
    social_handle_id: UUID | None = None


class CredentialResponse(BaseSchema):
    """Marketing credential response."""

    id: UUID
    product_id: UUID
    created_by: UUID
    label: str
    credential_type: str
    username: str | None = None
    email: str | None = None
    additional_info: str | None = None
    domain_id: UUID | None = None
    social_handle_id: UUID | None = None
    created_at: datetime
    updated_at: datetime


class CredentialDecryptResponse(BaseSchema):
    """Decrypted credential password."""

    id: UUID
    password: str | None = None
