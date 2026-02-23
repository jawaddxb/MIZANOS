"""Task template group service."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.models.task import TaskTemplate, TaskTemplateGroup
from apps.api.schemas.task_template import TaskTemplateGroupCreate
from apps.api.services.base_service import BaseService


class TaskTemplateGroupService(BaseService[TaskTemplateGroup]):
    """Business logic for task template groups (workflow templates)."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(TaskTemplateGroup, session)

    async def list_groups(
        self, source_type: str | None = None
    ) -> list[dict]:
        """List groups with item counts, optionally filtered by source_type."""
        stmt = (
            select(
                TaskTemplateGroup,
                func.count(TaskTemplate.id).label("item_count"),
            )
            .outerjoin(TaskTemplate, TaskTemplate.group_id == TaskTemplateGroup.id)
            .group_by(TaskTemplateGroup.id)
            .order_by(TaskTemplateGroup.order_index)
        )
        if source_type:
            stmt = stmt.where(TaskTemplateGroup.source_type == source_type)

        result = await self.repo.session.execute(stmt)
        rows = result.all()
        return [
            {**row[0].__dict__, "item_count": row[1]}
            for row in rows
        ]

    async def get_with_items(self, group_id: UUID) -> TaskTemplateGroup:
        """Load a group with its items eager-loaded."""
        stmt = (
            select(TaskTemplateGroup)
            .options(selectinload(TaskTemplateGroup.items))
            .where(TaskTemplateGroup.id == group_id)
        )
        result = await self.repo.session.execute(stmt)
        group = result.scalar_one_or_none()
        if group is None:
            from packages.common.utils.error_handlers import not_found

            raise not_found("TaskTemplateGroup")
        return group

    async def create_group(
        self, data: TaskTemplateGroupCreate
    ) -> TaskTemplateGroup:
        """Create a new template group."""
        group = TaskTemplateGroup(**data.model_dump())
        return await self.repo.create(group)

    async def reorder_groups(self, ordered_ids: list[UUID]) -> None:
        """Bulk-update order_index for groups based on array position."""
        for index, gid in enumerate(ordered_ids):
            group = await self.repo.get_by_id(gid)
            if group:
                await self.repo.update(group, {"order_index": index})
        await self.repo.session.flush()

    async def apply_group(
        self, group_id: UUID, product_id: UUID,
        *, created_by: "UUID | None" = None,
    ) -> list:
        """Create tasks from all active items within the group."""
        from apps.api.models.task import Task

        group = await self.get_with_items(group_id)
        tasks: list[Task] = []
        for item in group.items:
            if item.is_active is False:
                continue
            task = Task(
                product_id=product_id,
                title=item.title,
                description=item.description,
                status=item.default_status or "backlog",
                priority=item.priority or "medium",
                pillar=item.pillar,
                generation_source="template",
                is_draft=True,
                created_by=created_by,
            )
            self.repo.session.add(task)
            tasks.append(task)

        await self.repo.session.flush()
        for task in tasks:
            await self.repo.session.refresh(task)
        return tasks
