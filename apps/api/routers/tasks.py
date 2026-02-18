"""Tasks router."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.tasks import (
    TaskBulkApproveRequest,
    TaskBulkApproveResponse,
    TaskCreate,
    TaskListResponse,
    TaskResponse,
    TaskUpdate,
)
from apps.api.services.task_service import TaskService

router = APIRouter()


def get_service(db: DbSession) -> TaskService:
    return TaskService(db)


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    product_id: UUID | None = None,
    assignee_id: UUID | None = None,
    pm_id: UUID | None = None,
    status: str | None = None,
    priority: str | None = None,
    pillar: str | None = None,
    search: str | None = None,
    include_drafts: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    user: CurrentUser = None,
    service: TaskService = Depends(get_service),
):
    """List tasks with filtering. Excludes drafts by default."""
    return await service.list_tasks(
        product_id=product_id, assignee_id=assignee_id, pm_id=pm_id,
        status=status, priority=priority, pillar=pillar, search=search,
        include_drafts=include_drafts, page=page, page_size=page_size,
    )


@router.get("/drafts", response_model=list[TaskResponse])
async def list_drafts(
    product_id: UUID,
    user: CurrentUser = None,
    service: TaskService = Depends(get_service),
):
    """List draft tasks for a product."""
    return await service.list_drafts(product_id)


@router.post("/bulk-approve", response_model=TaskBulkApproveResponse)
async def bulk_approve_tasks(
    body: TaskBulkApproveRequest,
    user: CurrentUser = None,
    service: TaskService = Depends(get_service),
):
    """Approve multiple draft tasks."""
    return await service.bulk_approve_tasks(body.task_ids, user["id"])


@router.post("/bulk-reject", status_code=204)
async def bulk_reject_tasks(
    body: TaskBulkApproveRequest,
    user: CurrentUser = None,
    service: TaskService = Depends(get_service),
):
    """Reject (delete) multiple draft tasks."""
    await service.bulk_reject_tasks(body.task_ids)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    user: CurrentUser = None,
    service: TaskService = Depends(get_service),
):
    return await service.get_or_404(task_id)


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    body: TaskCreate,
    user: CurrentUser = None,
    service: TaskService = Depends(get_service),
):
    return await service.create_task(body)


@router.post("/{task_id}/approve", response_model=TaskResponse)
async def approve_task(
    task_id: UUID,
    user: CurrentUser = None,
    service: TaskService = Depends(get_service),
):
    """Approve a single draft task."""
    return await service.approve_task(task_id, user["id"])


@router.delete("/{task_id}/reject", status_code=204)
async def reject_task(
    task_id: UUID,
    user: CurrentUser = None,
    service: TaskService = Depends(get_service),
):
    """Reject (delete) a single draft task."""
    await service.reject_task(task_id)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    body: TaskUpdate,
    user: CurrentUser = None,
    service: TaskService = Depends(get_service),
):
    return await service.update(task_id, body.model_dump(exclude_unset=True))


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: UUID,
    user: CurrentUser = None,
    service: TaskService = Depends(get_service),
):
    await service.delete(task_id)


@router.patch("/{task_id}/reorder")
async def reorder_task(
    task_id: UUID,
    sort_order: int,
    user: CurrentUser = None,
    service: TaskService = Depends(get_service),
):
    """Update task sort order for kanban drag-drop."""
    return await service.update(task_id, {"sort_order": sort_order})
