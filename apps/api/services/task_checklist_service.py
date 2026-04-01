"""Task checklist service."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.task_checklist import TaskChecklistItem
from packages.common.utils.error_handlers import not_found


class TaskChecklistService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_assignees_by_tasks(self, task_ids: list[UUID]) -> dict[str, list[str]]:
        """Return {task_id: [assignee_name, ...]} for tasks with checklist assignees."""
        if not task_ids:
            return {}
        stmt = (
            select(TaskChecklistItem)
            .where(TaskChecklistItem.task_id.in_(task_ids))
            .where(TaskChecklistItem.assignee_id.is_not(None))
        )
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())

        grouped: dict[str, list[str]] = {}
        for item in items:
            tid = str(item.task_id)
            name = item.assignee.full_name if item.assignee else None
            if name:
                if tid not in grouped:
                    grouped[tid] = []
                if name not in grouped[tid]:
                    grouped[tid].append(name)
        return grouped

    async def list_items(self, task_id: UUID) -> list[TaskChecklistItem]:
        stmt = (
            select(TaskChecklistItem)
            .where(TaskChecklistItem.task_id == task_id)
            .order_by(TaskChecklistItem.sort_order, TaskChecklistItem.created_at)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_item(
        self, task_id: UUID, title: str, assignee_id: UUID | None = None,
    ) -> TaskChecklistItem:
        max_order = await self.session.execute(
            select(func.coalesce(func.max(TaskChecklistItem.sort_order), -1))
            .where(TaskChecklistItem.task_id == task_id)
        )
        next_order = (max_order.scalar_one() or 0) + 1

        item = TaskChecklistItem(
            task_id=task_id,
            title=title,
            assignee_id=assignee_id,
            sort_order=next_order,
        )
        self.session.add(item)
        await self.session.flush()
        await self.session.refresh(item)
        return item

    async def update_item(
        self, item_id: UUID, **updates,
    ) -> TaskChecklistItem:
        item = await self.session.get(TaskChecklistItem, item_id)
        if not item:
            raise not_found("ChecklistItem")
        for key, value in updates.items():
            if value is not None:
                setattr(item, key, value)
        await self.session.flush()
        await self.session.refresh(item)
        return item

    async def toggle_item(self, item_id: UUID) -> TaskChecklistItem:
        item = await self.session.get(TaskChecklistItem, item_id)
        if not item:
            raise not_found("ChecklistItem")
        item.is_checked = not item.is_checked
        await self.session.flush()
        await self.session.refresh(item)
        return item

    async def delete_item(self, item_id: UUID) -> None:
        item = await self.session.get(TaskChecklistItem, item_id)
        if not item:
            raise not_found("ChecklistItem")
        await self.session.delete(item)
        await self.session.flush()
