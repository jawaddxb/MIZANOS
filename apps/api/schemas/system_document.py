"""System document schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema, PaginatedResponse


class SystemDocumentBase(BaseSchema):
    """Shared system document fields."""

    doc_type: str
    title: str
    content: str | None = None
    version: int = 1
    generation_source: str | None = None
    source_metadata: dict | None = None


class SystemDocumentCreate(SystemDocumentBase):
    """System document creation schema."""

    product_id: UUID
    generated_by: UUID | None = None


class SystemDocumentUpdate(BaseSchema):
    """System document update schema."""

    title: str | None = None
    content: str | None = None
    version: int | None = None
    source_metadata: dict | None = None


class SystemDocumentResponse(SystemDocumentBase):
    """System document response."""

    id: UUID
    product_id: UUID
    generated_at: datetime | None = None
    generated_by: UUID | None = None
    created_at: datetime
    updated_at: datetime


class SystemDocumentListResponse(PaginatedResponse):
    """Paginated system document list."""

    data: list[SystemDocumentResponse]


class GenerateDocsRequest(BaseSchema):
    """Request to generate system documents."""

    source_path: str | None = None


class GenerateDocsResponse(BaseSchema):
    """Response from document generation."""

    documents_created: int
    doc_types: list[str]
