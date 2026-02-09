"""Task template service."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.task import TaskTemplate
from apps.api.schemas.task_template import TaskTemplateCreate
from apps.api.services.base_service import BaseService


class TaskTemplateService(BaseService[TaskTemplate]):
    """Task template business logic."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(TaskTemplate, session)

    async def list_by_source_type(
        self, source_type: str
    ) -> list[TaskTemplate]:
        """List templates filtered by source_type."""
        stmt = (
            select(TaskTemplate)
            .where(TaskTemplate.source_type == source_type)
            .order_by(TaskTemplate.order_index)
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def create_template(
        self, data: TaskTemplateCreate
    ) -> TaskTemplate:
        """Create a new task template."""
        template = TaskTemplate(**data.model_dump())
        return await self.repo.create(template)
