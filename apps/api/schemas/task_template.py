"""Task template schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


# ── Task Template schemas ──────────────────────────────────────────────


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
    group_id: UUID | None = None


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
    group_id: UUID | None = None


class TaskTemplateReorder(BaseSchema):
    """Schema for bulk reorder request."""

    source_type: str
    ordered_ids: list[UUID]


class TaskTemplateResponse(TaskTemplateBase):
    """Task template response."""

    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


# ── Task Template Group schemas ────────────────────────────────────────


class TaskTemplateGroupBase(BaseSchema):
    """Shared group fields."""

    name: str
    description: str | None = None
    source_type: str
    is_active: bool | None = True
    order_index: int | None = None


class TaskTemplateGroupCreate(TaskTemplateGroupBase):
    """Group creation schema."""


class TaskTemplateGroupUpdate(BaseSchema):
    """Group update schema (all optional)."""

    name: str | None = None
    description: str | None = None
    source_type: str | None = None
    is_active: bool | None = None
    order_index: int | None = None


class TaskTemplateGroupReorder(BaseSchema):
    """Schema for bulk reorder of groups."""

    ordered_ids: list[UUID]


class TaskTemplateGroupResponse(TaskTemplateGroupBase):
    """Group list response with item count."""

    id: UUID
    item_count: int = 0
    created_at: datetime
    updated_at: datetime


class TaskTemplateGroupDetailResponse(TaskTemplateGroupBase):
    """Group detail response with nested items."""

    id: UUID
    items: list[TaskTemplateResponse] = []
    created_at: datetime
    updated_at: datetime
