"""Document schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class DocumentBase(BaseSchema):
    """Product document fields."""

    file_name: str
    file_type: str | None = None
    file_size: int | None = None
    file_url: str | None = None
    ai_summary: str | None = None


class DocumentCreate(DocumentBase):
    """Document creation schema."""

    product_id: UUID
    uploaded_by: UUID
    folder_id: UUID | None = None


class DocumentResponse(DocumentBase):
    """Document response."""

    id: UUID
    product_id: UUID
    uploaded_by: UUID
    folder_id: UUID | None = None
    created_at: datetime


class FolderCreate(BaseSchema):
    """Folder creation schema."""

    name: str
    product_id: UUID
    parent_id: UUID | None = None


class FolderResponse(BaseSchema):
    """Folder response."""

    id: UUID
    name: str
    product_id: UUID
    parent_id: UUID | None = None
    created_at: datetime


class AccessLinkCreate(BaseSchema):
    """Document access link creation."""

    product_id: UUID
    created_by: UUID
    expires_at: datetime | None = None


class AccessLinkResponse(BaseSchema):
    """Access link response."""

    id: UUID
    token: str
    product_id: UUID
    created_by: UUID
    expires_at: datetime | None = None
    created_at: datetime
