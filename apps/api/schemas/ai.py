"""AI chat schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class ChatSessionCreate(BaseSchema):
    """Create a new chat session."""

    product_id: UUID | None = None


class ChatSessionResponse(BaseSchema):
    """Chat session response."""

    id: UUID
    user_id: str
    product_id: UUID | None = None
    created_at: datetime
    updated_at: datetime


class ChatMessageCreate(BaseSchema):
    """Send a message to the AI (streaming endpoint — session_id in body)."""

    content: str
    session_id: UUID


class SendMessageBody(BaseSchema):
    """Send a message (non-streaming — session_id comes from URL path)."""

    content: str


class ChatMessageResponse(BaseSchema):
    """Chat message response."""

    id: UUID
    session_id: UUID
    role: str
    content: str
    created_at: datetime
