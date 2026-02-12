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


class DomainUpdate(BaseSchema):
    """Domain update."""

    domain_name: str | None = None
    registrar: str | None = None
    expiry_date: datetime | None = None
    ssl_status: str | None = None
    dns_provider: str | None = None


class SocialHandleUpdate(BaseSchema):
    """Social handle update."""

    platform: str | None = None
    handle: str | None = None
    url: str | None = None
    status: str | None = None


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


class ApplyTemplateRequest(BaseSchema):
    """Request to apply a checklist template to a product."""

    product_id: UUID
    source_type: str


class ApplyTemplateResponse(BaseSchema):
    """Result of applying a template."""

    items_created: int


class TemplateTypeResponse(BaseSchema):
    """Available template source type with item count."""

    source_type: str
    item_count: int


class AutoPopulateDomain(BaseSchema):
    """Domain for auto-populate."""

    domain_name: str
    ssl_status: str | None = None
    is_secured: bool | None = None


class AutoPopulateSocialHandle(BaseSchema):
    """Social handle for auto-populate."""

    platform: str
    handle: str
    url: str | None = None


class AutoPopulateRequest(BaseSchema):
    """Request to auto-populate marketing records from scraped data."""

    product_id: UUID
    domains: list[AutoPopulateDomain] = []
    social_handles: list[AutoPopulateSocialHandle] = []
    logo_url: str | None = None


class AutoPopulateResponse(BaseSchema):
    """Result of auto-populate operation."""

    domains_created: int = 0
    social_handles_created: int = 0
    logo_updated: bool = False
