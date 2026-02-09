"""Notification service."""

from uuid import UUID

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.notification import Notification
from apps.api.services.base_service import BaseService


class NotificationService(BaseService[Notification]):
    """Notification business logic."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Notification, session)

    async def get_for_user(self, user_id: str) -> list[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(100)
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def count_unread(self, user_id: str) -> int:
        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
        )
        result = await self.repo.session.execute(stmt)
        return result.scalar_one()

    async def mark_as_read(self, notification_ids: list[UUID], user_id: str) -> None:
        stmt = (
            update(Notification)
            .where(
                Notification.id.in_(notification_ids),
                Notification.user_id == user_id,
            )
            .values(read=True)
        )
        await self.repo.session.execute(stmt)

    async def mark_all_read(self, user_id: str) -> None:
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
            .values(read=True)
        )
        await self.repo.session.execute(stmt)

    async def get_preferences(self, user_id) -> dict:
        return {
            "task_assignment": True,
            "audit_alerts": True,
            "deployment_updates": True,
            "weekly_digest": False,
        }

    async def update_preferences(self, user_id, data: dict) -> dict:
        defaults = {
            "task_assignment": True,
            "audit_alerts": True,
            "deployment_updates": True,
            "weekly_digest": False,
        }
        return {**defaults, **data}
