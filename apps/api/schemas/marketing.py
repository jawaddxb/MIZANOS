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
