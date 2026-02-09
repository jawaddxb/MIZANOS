"""QA check schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class QACheckBase(BaseSchema):
    """Shared QA check fields."""

    category: str
    check_name: str
    description: str | None = None
    is_passed: bool = False
    notes: str | None = None
    sort_order: int = 0


class QACheckCreate(QACheckBase):
    """QA check creation schema."""

    product_id: UUID


class QACheckUpdate(BaseSchema):
    """QA check update schema."""

    is_passed: bool | None = None
    notes: str | None = None


class QACheckResponse(QACheckBase):
    """QA check response."""

    id: UUID
    product_id: UUID
    created_at: datetime
