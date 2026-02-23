"""Task templates router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.task_template import (
    TaskTemplateCreate,
    TaskTemplateReorder,
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


@router.put("/reorder", status_code=204)
async def reorder_templates(
    body: TaskTemplateReorder,
    user: CurrentUser = None,
    service: TaskTemplateService = Depends(get_service),
):
    """Bulk reorder templates by source_type."""
    await service.reorder_templates(body.source_type, body.ordered_ids)


@router.post("/apply")
async def apply_templates(
    product_id: UUID,
    user: CurrentUser = None,
    service: TaskTemplateService = Depends(get_service),
    db: DbSession = None,
):
    """Apply templates to generate tasks for a product. PM/superadmin only."""
    from apps.api.models.enums import AppRole
    from apps.api.models.product import Product
    from packages.common.utils.error_handlers import forbidden

    if not user.has_any_role(AppRole.SUPERADMIN, AppRole.ADMIN, AppRole.PROJECT_MANAGER):
        raise forbidden("Only project managers and admins can generate tasks")

    product = await db.get(Product, product_id)
    if not product:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")

    if product.tasks_locked:
        from packages.common.utils.error_handlers import bad_request
        raise bad_request("Cannot generate tasks while tasks are locked")

    source_type = product.source_type or "general"
    return await service.apply_templates(product_id, source_type)


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
