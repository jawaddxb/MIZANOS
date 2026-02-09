"""Base Pydantic schemas shared across domains."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base schema with common configuration."""

    model_config = ConfigDict(from_attributes=True)


class TimestampSchema(BaseSchema):
    """Schema with timestamp fields."""

    created_at: datetime
    updated_at: datetime


class IDSchema(BaseSchema):
    """Schema with UUID id."""

    id: UUID


class PaginatedRequest(BaseModel):
    """Pagination query parameters."""

    page: int = 1
    page_size: int = 50
    search: str | None = None
    sort_by: str | None = None
    sort_order: str = "desc"


class PaginatedResponse(BaseSchema):
    """Paginated response wrapper."""

    total: int
    page: int
    page_size: int


class MessageResponse(BaseSchema):
    """Simple message response."""

    message: str
