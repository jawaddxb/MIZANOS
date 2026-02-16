"""Worker dependency injection — DB sessions and progress tracking."""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.common.db.session import async_session_factory
from apps.api.services.job_service import JobService

logger = logging.getLogger(__name__)


class JobContext:
    """Provides a DB session and progress helpers for worker tasks."""

    def __init__(self) -> None:
        self._session: AsyncSession | None = None

    async def get_session(self) -> AsyncSession:
        """Create a fresh DB session for the job."""
        if self._session is None:
            self._session = async_session_factory()
        return self._session

    async def update_progress(
        self, job_id: UUID, progress: int, message: str | None = None
    ) -> None:
        """Update job progress and descriptive label from inside a worker task."""
        session = await self.get_session()
        service = JobService(session)
        await service.update_progress(job_id, progress, message=message)
        await session.commit()

    async def mark_completed(self, job_id: UUID, result_data: dict | None = None) -> None:
        """Mark job as completed."""
        session = await self.get_session()
        service = JobService(session)
        await service.mark_completed(job_id, result_data)
        await session.commit()

    async def mark_failed(self, job_id: UUID, error_message: str) -> None:
        """Mark job as failed."""
        session = await self.get_session()
        service = JobService(session)
        await service.mark_failed(job_id, error_message)
        await session.commit()

    async def close(self) -> None:
        """Close the DB session."""
        if self._session is not None:
            await self._session.close()
            self._session = None
