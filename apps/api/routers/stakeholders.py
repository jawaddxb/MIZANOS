"""Stakeholder router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.products import (
    StakeholderCreate,
    StakeholderResponse,
    StakeholderUpdate,
)
from apps.api.services.stakeholder_service import StakeholderService

router = APIRouter()


def get_service(db: DbSession) -> StakeholderService:
    return StakeholderService(db)


@router.get(
    "/{product_id}/stakeholders",
    response_model=list[StakeholderResponse],
)
async def list_stakeholders(
    product_id: UUID,
    user: CurrentUser,
    service: StakeholderService = Depends(get_service),
):
    return await service.get_by_product(product_id)


@router.post(
    "/{product_id}/stakeholders",
    response_model=StakeholderResponse,
    status_code=201,
)
async def create_stakeholder(
    product_id: UUID,
    body: StakeholderCreate,
    user: CurrentUser,
    service: StakeholderService = Depends(get_service),
):
    return await service.create(product_id, body)


@router.patch(
    "/stakeholders/{stakeholder_id}",
    response_model=StakeholderResponse,
)
async def update_stakeholder(
    stakeholder_id: UUID,
    body: StakeholderUpdate,
    user: CurrentUser,
    service: StakeholderService = Depends(get_service),
):
    return await service.update(stakeholder_id, body)


@router.delete("/stakeholders/{stakeholder_id}", status_code=204)
async def delete_stakeholder(
    stakeholder_id: UUID,
    user: CurrentUser,
    service: StakeholderService = Depends(get_service),
):
    await service.delete(stakeholder_id)
