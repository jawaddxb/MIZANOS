"""Specifications router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.specifications import (
    SpecFeatureCreate,
    SpecFeatureResponse,
    SpecificationCreate,
    SpecificationResponse,
    SpecificationUpdate,
)
from apps.api.services.specification_service import SpecificationService

router = APIRouter()


def get_service(db: DbSession) -> SpecificationService:
    return SpecificationService(db)


@router.get("", response_model=list[SpecificationResponse])
async def list_specs(product_id: UUID, user: CurrentUser = None, service: SpecificationService = Depends(get_service)):
    return await service.get_by_product(product_id)


@router.get("/{spec_id}", response_model=SpecificationResponse)
async def get_spec(spec_id: UUID, user: CurrentUser = None, service: SpecificationService = Depends(get_service)):
    return await service.get_or_404(spec_id)


@router.post("", response_model=SpecificationResponse, status_code=201)
async def create_spec(body: SpecificationCreate, user: CurrentUser = None, service: SpecificationService = Depends(get_service)):
    return await service.create_spec(body)


@router.patch("/{spec_id}", response_model=SpecificationResponse)
async def update_spec(spec_id: UUID, body: SpecificationUpdate, user: CurrentUser = None, service: SpecificationService = Depends(get_service)):
    return await service.update(spec_id, body.model_dump(exclude_unset=True))


@router.get("/{spec_id}/features", response_model=list[SpecFeatureResponse])
async def list_features(spec_id: UUID, user: CurrentUser = None, service: SpecificationService = Depends(get_service)):
    return await service.get_features(spec_id)


@router.post("/features", response_model=SpecFeatureResponse, status_code=201)
async def create_feature(body: SpecFeatureCreate, user: CurrentUser = None, service: SpecificationService = Depends(get_service)):
    return await service.create_feature(body)


@router.post("/generate")
async def generate_spec(product_id: UUID, user: CurrentUser = None, service: SpecificationService = Depends(get_service)):
    """AI-generate specification from product context."""
    return await service.generate_specification(product_id)
