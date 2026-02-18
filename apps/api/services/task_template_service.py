"""Task template service."""

from uuid import UUID

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

    async def reorder_templates(
        self, source_type: str, ordered_ids: list[UUID]
    ) -> None:
        """Bulk-update order_index for templates based on array position."""
        for index, template_id in enumerate(ordered_ids):
            template = await self.repo.get_by_id(template_id)
            if template and template.source_type == source_type:
                await self.repo.update(template, {"order_index": index})
        await self.repo.session.flush()

    async def apply_templates(
        self, product_id: UUID, source_type: str
    ) -> list:
        """Apply groups first, then ungrouped templates for backward compat."""
        from apps.api.models.task import Task
        from apps.api.services.task_template_group_service import (
            TaskTemplateGroupService,
        )

        group_svc = TaskTemplateGroupService(self.repo.session)
        groups = await group_svc.list_groups(source_type)
        tasks: list[Task] = []

        # Apply all active groups
        for group_row in groups:
            if group_row.get("is_active") is False:
                continue
            group_tasks = await group_svc.apply_group(
                group_row["id"], product_id
            )
            tasks.extend(group_tasks)

        # Also apply ungrouped templates (group_id IS NULL)
        ungrouped = await self._list_ungrouped(source_type)
        for template in ungrouped:
            if template.is_active is False:
                continue
            task = Task(
                product_id=product_id,
                title=template.title,
                description=template.description,
                status=template.default_status or "backlog",
                priority=template.priority or "medium",
                pillar=template.pillar,
                generation_source="template",
                is_draft=True,
            )
            self.repo.session.add(task)
            tasks.append(task)

        await self.repo.session.flush()
        for task in tasks:
            await self.repo.session.refresh(task)
        return tasks

    async def _list_ungrouped(
        self, source_type: str
    ) -> list[TaskTemplate]:
        """List templates with no group for a given source_type."""
        stmt = (
            select(TaskTemplate)
            .where(TaskTemplate.source_type == source_type)
            .where(TaskTemplate.group_id.is_(None))
            .order_by(TaskTemplate.order_index)
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())
