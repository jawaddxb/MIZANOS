"""Specifications router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.specifications import (
    ImportFeatureRequest,
    LibraryFeatureResponse,
    MarkReusableRequest,
    SpecFeatureCreate,
    SpecFeatureResponse,
    SpecFeatureUpdate,
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


@router.patch("/features/{feature_id}", response_model=SpecFeatureResponse)
async def update_feature(
    feature_id: UUID,
    body: SpecFeatureUpdate,
    user: CurrentUser = None,
    service: SpecificationService = Depends(get_service),
):
    """Update a specification feature."""
    feature = await service._get_feature_or_404(feature_id)
    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(feature, key, value)
    await service.repo.session.flush()
    await service.repo.session.refresh(feature)
    return feature


@router.delete("/features/{feature_id}", status_code=204)
async def delete_feature(
    feature_id: UUID,
    user: CurrentUser = None,
    service: SpecificationService = Depends(get_service),
):
    """Delete a specification feature."""
    feature = await service._get_feature_or_404(feature_id)
    await service.repo.session.delete(feature)
    await service.repo.session.flush()


@router.get("/features/library", response_model=list[LibraryFeatureResponse])
async def list_library_features(
    user: CurrentUser = None,
    service: SpecificationService = Depends(get_service),
):
    """Get all reusable features in the library."""
    return await service.get_library_features()


@router.post(
    "/features/{feature_id}/mark-reusable",
    response_model=SpecFeatureResponse,
)
async def mark_reusable(
    feature_id: UUID,
    body: MarkReusableRequest,
    user: CurrentUser = None,
    service: SpecificationService = Depends(get_service),
):
    """Mark a feature as reusable with a category."""
    return await service.mark_feature_reusable(
        feature_id, body.reusable_category
    )


@router.post(
    "/features/{feature_id}/import",
    response_model=SpecFeatureResponse,
    status_code=201,
)
async def import_feature(
    feature_id: UUID,
    body: ImportFeatureRequest,
    user: CurrentUser = None,
    service: SpecificationService = Depends(get_service),
):
    """Import a reusable feature to a target product."""
    return await service.import_feature(feature_id, body)


@router.get("/features/{feature_id}/import-count")
async def get_import_count(
    feature_id: UUID,
    user: CurrentUser = None,
    service: SpecificationService = Depends(get_service),
):
    """Get how many times a feature has been imported."""
    count = await service.get_import_count(feature_id)
    return {"feature_id": str(feature_id), "import_count": count}


@router.post(
    "/features/{feature_id}/queue",
    response_model=SpecFeatureResponse,
)
async def queue_feature(
    feature_id: UUID,
    user: CurrentUser = None,
    service: SpecificationService = Depends(get_service),
):
    """Create a task from feature data and link it."""
    return await service.queue_feature(feature_id)


@router.post(
    "/features/{feature_id}/unqueue",
    response_model=SpecFeatureResponse,
)
async def unqueue_feature(
    feature_id: UUID,
    user: CurrentUser = None,
    service: SpecificationService = Depends(get_service),
):
    """Remove task link from feature."""
    return await service.unqueue_feature(feature_id)


@router.post("/generate")
async def generate_spec(product_id: UUID, user: CurrentUser = None, service: SpecificationService = Depends(get_service)):
    """AI-generate specification from product context."""
    return await service.generate_specification(product_id)


@router.post("/{product_id}/generate-tasks")
async def generate_tasks_from_spec(
    product_id: UUID,
    user: CurrentUser = None,
    service: SpecificationService = Depends(get_service),
):
    """Generate tasks from specification features."""
    return await service.generate_tasks_from_spec(product_id)
