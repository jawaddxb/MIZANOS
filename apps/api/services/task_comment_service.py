"""Task comment service."""

import re
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.models.task import Task
from apps.api.models.task_comment import TaskComment
from apps.api.models.user import Profile
from apps.api.services.task_notification_service import TaskNotificationService
from packages.common.utils.error_handlers import forbidden, not_found

MENTION_PATTERN = re.compile(r"@\[([0-9a-f\-]{36})\]")
EDIT_WINDOW = timedelta(minutes=10)


class TaskCommentService:
    """Business logic for task comments."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_comments(self, task_id: UUID) -> list[TaskComment]:
        """Top-level comments with eagerly loaded replies (2 levels)."""
        stmt = (
            select(TaskComment)
            .where(
                TaskComment.task_id == task_id,
                TaskComment.parent_id.is_(None),
            )
            .options(
                selectinload(TaskComment.author),
                selectinload(TaskComment.replies).selectinload(TaskComment.author),
            )
            .order_by(TaskComment.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    async def create_comment(
        self,
        task_id: UUID,
        author_id: UUID,
        content: str,
        parent_id: UUID | None = None,
    ) -> TaskComment:
        """Create a comment and send @mention notifications."""
        # Flatten threading: always reply to the root comment (Slack-style)
        if parent_id:
            parent = await self._get_or_404(parent_id)
            parent_id = parent.parent_id or parent.id

        comment = TaskComment(
            task_id=task_id,
            author_id=author_id,
            content=content,
            parent_id=parent_id,
        )
        self.session.add(comment)
        await self.session.flush()

        loaded = await self._load_with_relations(comment.id)
        await self._process_mentions(loaded, author_id)
        return loaded

    async def update_comment(
        self, comment_id: UUID, content: str, actor_id: UUID
    ) -> TaskComment:
        """Only the author can edit their comment within the edit window."""
        comment = await self._get_or_404(comment_id)
        if comment.author_id != actor_id:
            raise forbidden("Only the author can edit this comment")
        if not self._within_edit_window(comment):
            raise forbidden("Comments can only be edited within 10 minutes of posting")
        comment.content = content
        await self.session.flush()
        return await self._load_with_relations(comment_id)

    async def delete_comment(
        self, comment_id: UUID, actor_id: UUID
    ) -> None:
        """Author can delete their comment within the edit window."""
        comment = await self._get_or_404(comment_id)
        if comment.author_id != actor_id:
            raise forbidden("Only the author can delete this comment")
        if not self._within_edit_window(comment):
            raise forbidden("Comments can only be deleted within 10 minutes of posting")
        await self.session.delete(comment)
        await self.session.flush()

    def _within_edit_window(self, comment: TaskComment) -> bool:
        """Check if comment is within the 10-minute edit/delete window."""
        created = comment.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) - created < EDIT_WINDOW

    async def _get_or_404(self, comment_id: UUID) -> TaskComment:
        comment = await self.session.get(TaskComment, comment_id)
        if not comment:
            raise not_found("TaskComment")
        return comment

    async def _load_with_relations(self, comment_id: UUID) -> TaskComment:
        """Re-fetch a comment with author and replies eagerly loaded."""
        stmt = (
            select(TaskComment)
            .where(TaskComment.id == comment_id)
            .options(
                selectinload(TaskComment.author),
                selectinload(TaskComment.replies).selectinload(TaskComment.author),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def _process_mentions(
        self, comment: TaskComment, author_id: UUID
    ) -> None:
        """Parse @[profile_id] mentions and create notifications."""
        mentioned_ids = set(MENTION_PATTERN.findall(comment.content))
        if not mentioned_ids:
            return

        task = await self.session.get(Task, comment.task_id)
        if not task:
            return

        author = await self.session.get(Profile, author_id)
        author_name = author.full_name if author else "Someone"

        notif_svc = TaskNotificationService(self.session)
        for pid_str in mentioned_ids:
            pid = UUID(pid_str)
            if pid == author_id:
                continue
            await notif_svc.notify_comment_mention(
                task=task,
                author_name=author_name,
                comment_preview=comment.content,
                mentioned_profile_id=pid,
            )
