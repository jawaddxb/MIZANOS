"""Audit schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class AuditResponse(BaseSchema):
    """Audit result response."""

    id: UUID
    product_id: UUID
    overall_score: int
    categories: dict
    issues: dict
    created_by: UUID | None = None
    run_at: datetime
    created_at: datetime


class RunAuditRequest(BaseSchema):
    """Request to run a new audit."""

    product_id: UUID
