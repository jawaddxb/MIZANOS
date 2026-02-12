"""External document link schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class ExternalDocumentCreate(BaseSchema):
    """Create an external document link."""

    name: str
    url: str
    doc_type: str = "other"
    category: str = "general"
    description: str | None = None


class ExternalDocumentResponse(BaseSchema):
    """External document link response."""

    id: UUID
    product_id: UUID
    created_by: UUID
    name: str
    url: str
    doc_type: str
    category: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime
