"""Knowledge entry schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class KnowledgeBase(BaseSchema):
    """Knowledge entry fields."""

    title: str
    content: str | None = None
    category: str | None = None
    tags: list[str] = []


class KnowledgeCreate(KnowledgeBase):
    """Knowledge entry creation."""

    created_by: UUID


class KnowledgeUpdate(BaseSchema):
    """Knowledge entry update."""

    title: str | None = None
    content: str | None = None
    category: str | None = None
    tags: list[str] | None = None


class KnowledgeResponse(KnowledgeBase):
    """Knowledge entry response."""

    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
