"""Deployment checklist router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.products import (
    DeploymentChecklistResponse,
    DeploymentChecklistUpdate,
)
from apps.api.services.checklist_service import ChecklistService

router = APIRouter()


def get_service(db: DbSession) -> ChecklistService:
    return ChecklistService(db)


@router.get(
    "/{product_id}/deployment-checklist",
    response_model=list[DeploymentChecklistResponse],
)
async def get_checklist(
    product_id: UUID,
    user: CurrentUser,
    service: ChecklistService = Depends(get_service),
):
    return await service.get_checklist(product_id)


@router.post(
    "/{product_id}/deployment-checklist/seed",
    response_model=list[DeploymentChecklistResponse],
    status_code=201,
)
async def seed_checklist(
    product_id: UUID,
    user: CurrentUser,
    service: ChecklistService = Depends(get_service),
):
    return await service.seed_checklist(product_id)


@router.patch(
    "/deployment-checklist/{item_id}",
    response_model=DeploymentChecklistResponse,
)
async def update_checklist_item(
    item_id: UUID,
    body: DeploymentChecklistUpdate,
    user: CurrentUser,
    service: ChecklistService = Depends(get_service),
):
    return await service.update_item(item_id, body.model_dump(exclude_unset=True))
