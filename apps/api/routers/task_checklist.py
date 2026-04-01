"""Task checklist router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.task_checklist import (
    ChecklistItemCreate,
    ChecklistItemResponse,
    ChecklistItemUpdate,
)
from apps.api.services.task_checklist_service import TaskChecklistService

router = APIRouter()


def get_service(db: DbSession) -> TaskChecklistService:
    return TaskChecklistService(db)


@router.post(
    "/checklist-assignees",
)
async def get_checklist_assignees(
    body: dict,
    user: CurrentUser,
    service: TaskChecklistService = Depends(get_service),
):
    task_ids = [UUID(tid) for tid in body.get("task_ids", [])]
    return await service.get_assignees_by_tasks(task_ids)


@router.get(
    "/{task_id}/checklist",
    response_model=list[ChecklistItemResponse],
)
async def list_checklist(
    task_id: UUID,
    user: CurrentUser,
    service: TaskChecklistService = Depends(get_service),
):
    items = await service.list_items(task_id)
    return [ChecklistItemResponse.from_orm_with_assignee(i) for i in items]


@router.post(
    "/{task_id}/checklist",
    response_model=ChecklistItemResponse,
    status_code=201,
)
async def create_checklist_item(
    task_id: UUID,
    body: ChecklistItemCreate,
    user: CurrentUser,
    service: TaskChecklistService = Depends(get_service),
):
    item = await service.create_item(task_id, body.title, body.assignee_id)
    return ChecklistItemResponse.from_orm_with_assignee(item)


@router.patch(
    "/{task_id}/checklist/{item_id}",
    response_model=ChecklistItemResponse,
)
async def update_checklist_item(
    task_id: UUID,
    item_id: UUID,
    body: ChecklistItemUpdate,
    user: CurrentUser,
    service: TaskChecklistService = Depends(get_service),
):
    updates = body.model_dump(exclude_unset=True)
    item = await service.update_item(item_id, **updates)
    return ChecklistItemResponse.from_orm_with_assignee(item)


@router.patch(
    "/{task_id}/checklist/{item_id}/toggle",
    response_model=ChecklistItemResponse,
)
async def toggle_checklist_item(
    task_id: UUID,
    item_id: UUID,
    user: CurrentUser,
    service: TaskChecklistService = Depends(get_service),
):
    item = await service.toggle_item(item_id)
    return ChecklistItemResponse.from_orm_with_assignee(item)


@router.delete("/{task_id}/checklist/{item_id}", status_code=204)
async def delete_checklist_item(
    task_id: UUID,
    item_id: UUID,
    user: CurrentUser,
    service: TaskChecklistService = Depends(get_service),
):
    await service.delete_item(item_id)
