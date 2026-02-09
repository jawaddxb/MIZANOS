"""Product schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema, PaginatedResponse


class ProductBase(BaseSchema):
    """Shared product fields."""

    name: str
    description: str | None = None
    status: str = "intake"
    current_stage: str | None = None
    health_score: int | None = None
    progress: int = 0
    repository_url: str | None = None
    target_launch_date: datetime | None = None
    project_source: str | None = None
    source_url: str | None = None


class ProductCreate(ProductBase):
    """Product creation schema."""

    pm_id: UUID | None = None
    engineer_id: UUID | None = None


class ProductUpdate(BaseSchema):
    """Product update schema (all optional)."""

    name: str | None = None
    description: str | None = None
    status: str | None = None
    current_stage: str | None = None
    health_score: int | None = None
    progress: int | None = None
    repository_url: str | None = None
    target_launch_date: datetime | None = None
    pm_id: UUID | None = None
    engineer_id: UUID | None = None


class ProductResponse(ProductBase):
    """Product response."""

    id: UUID
    pm_id: UUID | None = None
    engineer_id: UUID | None = None
    created_at: datetime
    updated_at: datetime


class ProductListResponse(PaginatedResponse):
    """Paginated product list."""

    data: list[ProductResponse]


class ManagementNoteCreate(BaseSchema):
    """Management note creation."""

    content: str
    author_id: UUID
    is_pinned: bool = False


class ManagementNoteResponse(BaseSchema):
    """Management note response."""

    id: UUID
    product_id: UUID
    author_id: UUID
    content: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime


class PartnerNoteCreate(BaseSchema):
    """Partner note creation."""

    partner_name: str
    content: str
    author_id: UUID


class PartnerNoteResponse(BaseSchema):
    """Partner note response."""

    id: UUID
    product_id: UUID
    author_id: UUID
    partner_name: str
    content: str
    created_at: datetime
    updated_at: datetime
