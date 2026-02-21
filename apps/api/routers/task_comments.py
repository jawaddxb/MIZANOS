"""Task comments router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.task_comments import (
    TaskCommentCreate,
    TaskCommentResponse,
    TaskCommentUpdate,
)
from apps.api.services.task_comment_service import TaskCommentService

router = APIRouter()


def get_service(db: DbSession) -> TaskCommentService:
    return TaskCommentService(db)


@router.get(
    "/{task_id}/comments",
    response_model=list[TaskCommentResponse],
)
async def list_comments(
    task_id: UUID,
    user: CurrentUser,
    service: TaskCommentService = Depends(get_service),
):
    return await service.list_comments(task_id)


@router.post(
    "/{task_id}/comments",
    response_model=TaskCommentResponse,
    status_code=201,
)
async def create_comment(
    task_id: UUID,
    body: TaskCommentCreate,
    user: CurrentUser,
    service: TaskCommentService = Depends(get_service),
):
    return await service.create_comment(
        task_id=task_id,
        author_id=user.profile_id,
        content=body.content,
        parent_id=body.parent_id,
    )


@router.patch(
    "/{task_id}/comments/{comment_id}",
    response_model=TaskCommentResponse,
)
async def update_comment(
    task_id: UUID,
    comment_id: UUID,
    body: TaskCommentUpdate,
    user: CurrentUser,
    service: TaskCommentService = Depends(get_service),
):
    return await service.update_comment(comment_id, body.content, user.profile_id)


@router.delete("/{task_id}/comments/{comment_id}", status_code=204)
async def delete_comment(
    task_id: UUID,
    comment_id: UUID,
    user: CurrentUser,
    service: TaskCommentService = Depends(get_service),
):
    await service.delete_comment(comment_id, user.profile_id)
