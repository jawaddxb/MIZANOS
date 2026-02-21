"""Task comment schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from apps.api.schemas.base import BaseSchema
from apps.api.schemas.products import ProfileSummary


class TaskCommentCreate(BaseSchema):
    """Create a comment on a task."""

    content: str
    parent_id: UUID | None = None


class TaskCommentUpdate(BaseSchema):
    """Update a comment."""

    content: str


class TaskCommentResponse(BaseSchema):
    """Comment response with author and nested replies."""

    id: UUID
    task_id: UUID
    author_id: UUID
    content: str
    parent_id: Optional[UUID] = None
    author: Optional[ProfileSummary] = None
    replies: list["TaskCommentResponse"] = []
    created_at: datetime
    updated_at: datetime


TaskCommentResponse.model_rebuild()
