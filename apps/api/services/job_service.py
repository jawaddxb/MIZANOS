"""Job service — CRUD + Arq enqueue for background tasks."""

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.job import Job
from apps.api.services.base_service import BaseService
from packages.common.redis import get_arq_redis

logger = logging.getLogger(__name__)


class JobService(BaseService[Job]):
    """Manages job lifecycle: create → enqueue → track → complete/fail."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Job, session)

    async def create_and_enqueue(
        self,
        *,
        job_type: str,
        arq_function: str,
        user_id: str,
        product_id: UUID | None = None,
        input_data: dict | None = None,
    ) -> Job:
        """Create a Job record and enqueue it in Arq."""
        job = Job(
            job_type=job_type,
            status="pending",
            progress=0,
            product_id=product_id,
            user_id=user_id,
            input_data=input_data,
        )
        self.repo.session.add(job)
        await self.repo.session.flush()
        await self.repo.session.refresh(job)

        redis = await get_arq_redis()
        arq_job = await redis.enqueue_job(arq_function, str(job.id))
        if arq_job:
            job.arq_job_id = arq_job.job_id
            await self.repo.session.flush()

        logger.info("Enqueued job %s (type=%s, arq=%s)", job.id, job_type, job.arq_job_id)
        return job

    async def update_progress(
        self,
        job_id: UUID,
        progress: int,
        message: str | None = None,
        status: str = "running",
    ) -> Job:
        """Update job progress and descriptive message (called by workers)."""
        job = await self.get_or_404(job_id)
        job.progress = min(progress, 100)
        job.status = status
        if message is not None:
            job.progress_message = message
        if status == "running" and job.started_at is None:
            job.started_at = datetime.now(timezone.utc)
        await self.repo.session.flush()
        await self.repo.session.refresh(job)
        return job

    async def mark_completed(self, job_id: UUID, result_data: dict | None = None) -> Job:
        """Mark a job as successfully completed."""
        job = await self.get_or_404(job_id)
        job.status = "completed"
        job.progress = 100
        job.result_data = result_data
        job.completed_at = datetime.now(timezone.utc)
        await self.repo.session.flush()
        await self.repo.session.refresh(job)
        logger.info("Job %s completed", job_id)
        return job

    async def mark_failed(self, job_id: UUID, error_message: str) -> Job:
        """Mark a job as failed."""
        job = await self.get_or_404(job_id)
        job.status = "failed"
        job.error_message = error_message
        job.completed_at = datetime.now(timezone.utc)
        await self.repo.session.flush()
        await self.repo.session.refresh(job)
        logger.warning("Job %s failed: %s", job_id, error_message)
        return job

    async def list_by_product(
        self,
        product_id: UUID,
        *,
        status: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Job], int]:
        """List jobs for a product with optional status filter."""
        stmt = select(Job).where(Job.product_id == product_id)
        if status:
            stmt = stmt.where(Job.status == status)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.repo.session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(Job.created_at.desc()).offset(offset).limit(limit)
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all()), total
