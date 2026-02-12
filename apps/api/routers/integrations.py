"""Project integrations router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.products import (
    ProjectIntegrationCreate,
    ProjectIntegrationResponse,
    ProjectIntegrationUpdate,
)
from apps.api.services.integration_service import IntegrationService

router = APIRouter()


def get_service(db: DbSession) -> IntegrationService:
    return IntegrationService(db)


@router.get(
    "/{product_id}/integrations",
    response_model=list[ProjectIntegrationResponse],
)
async def list_integrations(
    product_id: UUID,
    user: CurrentUser = None,
    service: IntegrationService = Depends(get_service),
):
    return await service.get_by_product(product_id)


@router.post(
    "/{product_id}/integrations",
    response_model=ProjectIntegrationResponse,
    status_code=201,
)
async def create_integration(
    product_id: UUID,
    body: ProjectIntegrationCreate,
    user: CurrentUser = None,
    service: IntegrationService = Depends(get_service),
):
    return await service.create(product_id, body)


@router.patch(
    "/project-integrations/{integration_id}",
    response_model=ProjectIntegrationResponse,
)
async def update_integration(
    integration_id: UUID,
    body: ProjectIntegrationUpdate,
    user: CurrentUser = None,
    service: IntegrationService = Depends(get_service),
):
    return await service.update(integration_id, body)


@router.delete("/project-integrations/{integration_id}", status_code=204)
async def delete_integration(
    integration_id: UUID,
    user: CurrentUser = None,
    service: IntegrationService = Depends(get_service),
):
    await service.delete(integration_id)
