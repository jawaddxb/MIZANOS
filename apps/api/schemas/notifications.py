"""Notification schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class NotificationResponse(BaseSchema):
    """Notification response."""

    id: UUID
    user_id: str
    type: str
    title: str
    message: str | None = None
    read: bool = False
    product_id: UUID | None = None
    task_id: UUID | None = None
    created_at: datetime


class MarkReadRequest(BaseSchema):
    """Mark notifications as read."""

    notification_ids: list[UUID]
