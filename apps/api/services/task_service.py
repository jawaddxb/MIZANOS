"""Task service."""

from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.task import Task
from apps.api.schemas.tasks import TaskCreate
from apps.api.services.base_service import BaseService


class TaskService(BaseService[Task]):
    """Task-specific business logic."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Task, session)

    async def list_tasks(
        self,
        *,
        product_id: UUID | None = None,
        assignee_id: UUID | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> dict:
        """List tasks with optional filtering."""
        stmt = select(Task)

        if product_id:
            stmt = stmt.where(Task.product_id == product_id)
        if assignee_id:
            stmt = stmt.where(Task.assignee_id == assignee_id)
        if status:
            stmt = stmt.where(Task.status == status)

        stmt = stmt.order_by(Task.sort_order)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.repo.session.execute(count_stmt)).scalar_one()

        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await self.repo.session.execute(stmt)
        data = list(result.scalars().all())

        return {"data": data, "total": total, "page": page, "page_size": page_size}

    async def create_task(self, data: TaskCreate) -> Task:
        """Create a new task."""
        task = Task(**data.model_dump())
        return await self.repo.create(task)
