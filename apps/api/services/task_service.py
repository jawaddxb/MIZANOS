"""Task service."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.product import ProductMember
from apps.api.models.settings import OrgSetting
from apps.api.models.task import Task
from apps.api.models.user import Profile
from apps.api.schemas.tasks import TaskCreate
from apps.api.services.base_service import BaseService
from packages.common.utils.error_handlers import bad_request


class TaskService(BaseService[Task]):
    """Task-specific business logic."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Task, session)

    async def list_tasks(
        self,
        *,
        product_id: UUID | None = None,
        assignee_id: UUID | None = None,
        pm_id: UUID | None = None,
        status: str | None = None,
        priority: str | None = None,
        pillar: str | None = None,
        search: str | None = None,
        include_drafts: bool = False,
        page: int = 1,
        page_size: int = 50,
    ) -> dict:
        """List tasks with optional filtering. Excludes drafts by default."""
        stmt = select(Task)

        if not include_drafts:
            stmt = stmt.where(Task.is_draft == False)  # noqa: E712

        if product_id:
            stmt = stmt.where(Task.product_id == product_id)
        if assignee_id:
            stmt = stmt.where(Task.assignee_id == assignee_id)
        if pm_id:
            stmt = stmt.join(
                ProductMember,
                (Task.product_id == ProductMember.product_id)
                & (ProductMember.profile_id == pm_id)
                & (ProductMember.role == "pm"),
            )
        if status:
            stmt = stmt.where(Task.status == status)
        if priority:
            stmt = stmt.where(Task.priority == priority)
        if pillar:
            stmt = stmt.where(Task.pillar == pillar)
        if search:
            stmt = stmt.where(Task.title.ilike(f"%{search}%"))

        stmt = stmt.order_by(Task.sort_order)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.repo.session.execute(count_stmt)).scalar_one()

        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await self.repo.session.execute(stmt)
        data = list(result.scalars().all())

        return {"data": data, "total": total, "page": page, "page_size": page_size}

    async def list_drafts(self, product_id: UUID) -> list[Task]:
        """List draft tasks for a product."""
        stmt = (
            select(Task)
            .where(Task.product_id == product_id, Task.is_draft == True)  # noqa: E712
            .order_by(Task.created_at.desc())
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def approve_task(self, task_id: UUID, approver_id: UUID) -> Task:
        """Approve a draft task, making it a real assignable task."""
        task = await self.get_or_404(task_id)
        return await self.repo.update(task, {
            "is_draft": False,
            "approved_by": approver_id,
            "approved_at": datetime.now(timezone.utc),
        })

    async def bulk_approve_tasks(
        self, task_ids: list[UUID], approver_id: UUID
    ) -> dict:
        """Approve multiple draft tasks."""
        now = datetime.now(timezone.utc)
        approved = []
        for tid in task_ids:
            task = await self.get_or_404(tid)
            await self.repo.update(task, {
                "is_draft": False,
                "approved_by": approver_id,
                "approved_at": now,
            })
            approved.append(tid)
        return {"approved_count": len(approved), "task_ids": approved}

    async def reject_task(self, task_id: UUID) -> None:
        """Reject (delete) a draft task."""
        task = await self.get_or_404(task_id)
        await self.repo.delete(task)

    async def bulk_reject_tasks(self, task_ids: list[UUID]) -> None:
        """Reject (delete) multiple draft tasks."""
        stmt = sa_delete(Task).where(Task.id.in_(task_ids))
        await self.repo.session.execute(stmt)

    async def create_task(self, data: TaskCreate) -> Task:
        """Create a new task."""
        if data.assignee_id:
            await self._validate_assignee(data.assignee_id)
        task = Task(**data.model_dump())
        return await self.repo.create(task)

    async def update(self, entity_id: UUID, data: dict) -> Task:
        """Update a task with assignee validation."""
        if "assignee_id" in data and data["assignee_id"]:
            await self._validate_assignee(UUID(str(data["assignee_id"])))
        return await super().update(entity_id, data)

    async def _validate_assignee(self, assignee_id: UUID) -> None:
        """Reject assigning to pending profiles when org setting is off."""
        stmt = select(OrgSetting.value).where(
            OrgSetting.key == "show_pending_profiles_in_assignments"
        )
        result = await self.repo.session.execute(stmt)
        setting_value = result.scalar_one_or_none()

        if setting_value and setting_value.get("enabled"):
            return

        profile = await self.repo.session.get(Profile, assignee_id)
        if profile and profile.status == "pending":
            raise bad_request(
                "Cannot assign tasks to users with pending activation"
            )
