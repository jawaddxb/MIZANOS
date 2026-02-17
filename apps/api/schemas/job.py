"""Job schemas for background task queue."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema, PaginatedResponse


class JobResponse(BaseSchema):
    """Single job status response."""

    id: UUID
    job_type: str
    status: str
    progress: int
    progress_message: str | None = None
    product_id: UUID | None = None
    user_id: str | None = None
    input_data: dict | None = None
    result_data: dict | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    retry_count: int = 0
    arq_job_id: str | None = None
    created_at: datetime
    updated_at: datetime


class JobCreateResponse(BaseSchema):
    """Response returned when a job is enqueued."""

    job_id: UUID
    status: str


class JobListResponse(PaginatedResponse):
    """Paginated job list."""

    data: list[JobResponse]
