"""Task templates router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.task_template import (
    TaskTemplateCreate,
    TaskTemplateResponse,
    TaskTemplateUpdate,
)
from apps.api.services.task_template_service import TaskTemplateService

router = APIRouter()


def get_service(db: DbSession) -> TaskTemplateService:
    return TaskTemplateService(db)


@router.get("", response_model=list[TaskTemplateResponse])
async def list_templates(
    source_type: str | None = None,
    user: CurrentUser = None,
    service: TaskTemplateService = Depends(get_service),
):
    """List task templates, optionally filtered by source_type."""
    if source_type:
        return await service.list_by_source_type(source_type)
    return await service.list()


@router.post("", response_model=TaskTemplateResponse, status_code=201)
async def create_template(
    body: TaskTemplateCreate,
    user: CurrentUser = None,
    service: TaskTemplateService = Depends(get_service),
):
    """Create a new task template."""
    return await service.create_template(body)


@router.patch("/{template_id}", response_model=TaskTemplateResponse)
async def update_template(
    template_id: UUID,
    body: TaskTemplateUpdate,
    user: CurrentUser = None,
    service: TaskTemplateService = Depends(get_service),
):
    """Update a task template."""
    return await service.update(
        template_id, body.model_dump(exclude_unset=True)
    )


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: UUID,
    user: CurrentUser = None,
    service: TaskTemplateService = Depends(get_service),
):
    """Delete a task template."""
    await service.delete(template_id)
