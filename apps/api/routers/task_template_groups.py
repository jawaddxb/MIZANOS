"""Task template groups router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.task_template import (
    TaskTemplateGroupCreate,
    TaskTemplateGroupDetailResponse,
    TaskTemplateGroupReorder,
    TaskTemplateGroupResponse,
    TaskTemplateGroupUpdate,
)
from apps.api.services.task_template_group_service import TaskTemplateGroupService

router = APIRouter()


def get_service(db: DbSession) -> TaskTemplateGroupService:
    return TaskTemplateGroupService(db)


@router.get("", response_model=list[TaskTemplateGroupResponse])
async def list_groups(
    source_type: str | None = None,
    user: CurrentUser,
    service: TaskTemplateGroupService = Depends(get_service),
):
    """List template groups with item counts."""
    return await service.list_groups(source_type)


@router.post("", response_model=TaskTemplateGroupResponse, status_code=201)
async def create_group(
    body: TaskTemplateGroupCreate,
    user: CurrentUser,
    service: TaskTemplateGroupService = Depends(get_service),
):
    """Create a new template group."""
    group = await service.create_group(body)
    return {**group.__dict__, "item_count": 0}


@router.get("/{group_id}", response_model=TaskTemplateGroupDetailResponse)
async def get_group(
    group_id: UUID,
    user: CurrentUser,
    service: TaskTemplateGroupService = Depends(get_service),
):
    """Get a group with its items."""
    return await service.get_with_items(group_id)


@router.patch("/{group_id}", response_model=TaskTemplateGroupResponse)
async def update_group(
    group_id: UUID,
    body: TaskTemplateGroupUpdate,
    user: CurrentUser,
    service: TaskTemplateGroupService = Depends(get_service),
):
    """Update a template group."""
    group = await service.update(
        group_id, body.model_dump(exclude_unset=True)
    )
    return {**group.__dict__, "item_count": 0}


@router.delete("/{group_id}", status_code=204)
async def delete_group(
    group_id: UUID,
    user: CurrentUser,
    service: TaskTemplateGroupService = Depends(get_service),
):
    """Delete a template group."""
    await service.delete(group_id)


@router.put("/reorder", status_code=204)
async def reorder_groups(
    body: TaskTemplateGroupReorder,
    user: CurrentUser,
    service: TaskTemplateGroupService = Depends(get_service),
):
    """Bulk reorder groups."""
    await service.reorder_groups(body.ordered_ids)


@router.post("/{group_id}/apply")
async def apply_group(
    group_id: UUID,
    product_id: UUID,
    user: CurrentUser,
    service: TaskTemplateGroupService = Depends(get_service),
):
    """Apply a group's templates to create tasks for a product."""
    return await service.apply_group(group_id, product_id)
