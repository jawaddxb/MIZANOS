"""Jobs router — read-only endpoints for job status polling."""

from uuid import UUID

from fastapi import APIRouter, Query

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.job import JobListResponse, JobResponse
from apps.api.services.job_service import JobService

router = APIRouter()


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: UUID, db: DbSession, user: CurrentUser):
    """Get a single job by ID."""
    service = JobService(db)
    return await service.get_or_404(job_id)


@router.get("", response_model=JobListResponse)
async def list_jobs(
    db: DbSession,
    user: CurrentUser,
    product_id: UUID | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """List jobs, optionally filtered by product_id and status."""
    if product_id is None:
        # Return empty when no product_id provided
        return {"data": [], "total": 0, "page": page, "page_size": page_size}

    service = JobService(db)
    offset = (page - 1) * page_size
    jobs, total = await service.list_by_product(
        product_id, status=status, offset=offset, limit=page_size
    )
    return {"data": jobs, "total": total, "page": page, "page_size": page_size}
