"""Task template schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class TaskTemplateBase(BaseSchema):
    """Shared task template fields."""

    title: str
    description: str | None = None
    pillar: str
    priority: str | None = None
    default_status: str | None = None
    source_type: str
    order_index: int | None = None
    is_active: bool | None = True


class TaskTemplateCreate(TaskTemplateBase):
    """Task template creation schema."""


class TaskTemplateUpdate(BaseSchema):
    """Task template update schema (all optional)."""

    title: str | None = None
    description: str | None = None
    pillar: str | None = None
    priority: str | None = None
    default_status: str | None = None
    source_type: str | None = None
    order_index: int | None = None
    is_active: bool | None = None


class TaskTemplateResponse(TaskTemplateBase):
    """Task template response."""

    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
