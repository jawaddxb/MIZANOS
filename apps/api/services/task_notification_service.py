"""Task notification service — encapsulates notification logic for task events."""

import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.notification import Notification
from apps.api.models.product import Product, ProductNotificationSetting
from apps.api.models.task import Task
from apps.api.models.user import Profile, UserNotificationPreference
from apps.api.services.email_service import EmailService

logger = logging.getLogger(__name__)


class TaskNotificationService:
    """Handles in-app and email notifications for task-related events."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def notify_task_assigned(
        self, task: Task, assignee_id: UUID
    ) -> None:
        """Notify a user that they've been assigned a task."""
        profile = await self._get_profile(assignee_id)
        if not profile:
            return

        product = await self.session.get(Product, task.product_id)
        product_name = product.name if product else "Unknown Project"

        self.session.add(Notification(
            user_id=profile.user_id,
            title="Task Assigned",
            message=f'You\'ve been assigned to "{task.title}" in {product_name}',
            type="task_assigned",
            product_id=task.product_id,
            task_id=task.id,
        ))
        await self.session.flush()

        if not await self._user_wants_task_notifications(profile.user_id):
            return
        if not await self._product_email_enabled(task.product_id):
            return

        task_url = f"/products/{task.product_id}"
        await EmailService.send_task_assignment_email(
            to_email=profile.email or "",
            full_name=profile.full_name or "Team Member",
            task_title=task.title,
            product_name=product_name,
            task_url=task_url,
        )

    async def notify_bulk_tasks_assigned(
        self, tasks: list[Task], assignee_id: UUID
    ) -> None:
        """Notify a user about multiple task assignments (single email)."""
        profile = await self._get_profile(assignee_id)
        if not profile:
            return

        task_details: list[dict] = []
        for task in tasks:
            product = await self.session.get(Product, task.product_id)
            product_name = product.name if product else "Unknown Project"

            self.session.add(Notification(
                user_id=profile.user_id,
                title="Task Assigned",
                message=f'You\'ve been assigned to "{task.title}" in {product_name}',
                type="task_assigned",
                product_id=task.product_id,
                task_id=task.id,
            ))

            if await self._product_email_enabled(task.product_id):
                task_details.append({
                    "title": task.title,
                    "product_name": product_name,
                })

        await self.session.flush()

        if not await self._user_wants_task_notifications(profile.user_id):
            return
        if task_details:
            await EmailService.send_bulk_task_assignment_email(
                to_email=profile.email or "",
                full_name=profile.full_name or "Team Member",
                tasks=task_details,
            )

    async def notify_comment_mention(
        self, task: Task, author_name: str, comment_preview: str,
        mentioned_profile_id: UUID,
    ) -> None:
        """Notify a user that they were @mentioned in a comment."""
        profile = await self._get_profile(mentioned_profile_id)
        if not profile:
            return

        product = await self.session.get(Product, task.product_id)
        product_name = product.name if product else "Unknown Project"

        self.session.add(Notification(
            user_id=profile.user_id,
            title="Mentioned in Comment",
            message=f'{author_name} mentioned you in a comment on "{task.title}"',
            type="comment_mention",
            product_id=task.product_id,
            task_id=task.id,
        ))
        await self.session.flush()

        if not await self._user_wants_task_notifications(profile.user_id):
            return
        if not await self._product_email_enabled(task.product_id):
            return

        task_url = f"/products/{task.product_id}"
        await EmailService.send_comment_mention_email(
            to_email=profile.email or "",
            full_name=profile.full_name or "Team Member",
            author_name=author_name,
            task_title=task.title,
            comment_preview=comment_preview[:200],
            task_url=task_url,
        )

    async def _get_profile(self, profile_id: UUID) -> Profile | None:
        return await self.session.get(Profile, profile_id)

    async def _user_wants_task_notifications(self, user_id: str) -> bool:
        stmt = select(UserNotificationPreference.task_assignment).where(
            UserNotificationPreference.user_id == user_id
        )
        result = await self.session.execute(stmt)
        pref = result.scalar_one_or_none()
        return pref is not False

    async def _product_email_enabled(self, product_id: UUID) -> bool:
        stmt = select(ProductNotificationSetting.email_enabled).where(
            ProductNotificationSetting.product_id == product_id
        )
        result = await self.session.execute(stmt)
        setting = result.scalar_one_or_none()
        return setting is not False
