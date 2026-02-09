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


class FileUploadCreate(BaseSchema):
    """Knowledge file upload creation."""

    created_by: UUID
    title: str
    category: str = "document"
    file_name: str
    file_type: str
    file_size: int
    file_path: str | None = None


class TranscribeCreate(BaseSchema):
    """Knowledge audio transcription creation."""

    created_by: UUID
    title: str
    category: str = "audio"
    file_name: str
    file_type: str = "audio/webm"
    file_size: int = 0
