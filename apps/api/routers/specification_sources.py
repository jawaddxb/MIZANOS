"""Specification sources router — CRUD + file upload for project sources."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.products import (
    SpecificationSourceCreate,
    SpecificationSourceResponse,
)
from apps.api.services.gcs_storage_service import GCSStorageService
from apps.api.services.product_service import ProductService
from apps.api.services.source_upload_service import SourceUploadService
from packages.common.utils.error_handlers import not_found

router = APIRouter()


def get_service(db: DbSession) -> ProductService:
    return ProductService(db)


@router.get(
    "/{product_id}/specification-sources",
    response_model=list[SpecificationSourceResponse],
)
async def list_product_sources(
    product_id: UUID,
    user: CurrentUser = None,
    service: ProductService = Depends(get_service),
):
    """Get all specification sources for a product."""
    return await service.get_specification_sources(product_id)


@router.post(
    "/{product_id}/specification-sources",
    response_model=SpecificationSourceResponse,
    status_code=201,
)
async def create_product_source(
    product_id: UUID,
    body: SpecificationSourceCreate,
    user: CurrentUser = None,
    service: ProductService = Depends(get_service),
):
    """Create a specification source for a product."""
    return await service.create_specification_source(product_id, body)


@router.post(
    "/{product_id}/specification-sources/upload",
    response_model=SpecificationSourceResponse,
    status_code=201,
)
async def upload_product_source(
    product_id: UUID,
    file: UploadFile = File(...),
    user: CurrentUser = None,
    db: DbSession = None,
):
    """Upload a binary source document (PDF, DOCX, images) to GCS."""
    service = SourceUploadService(db)
    return await service.upload_source(product_id, file)


@router.get("/specification-sources/{source_id}/download-url")
async def get_source_download_url(
    source_id: UUID,
    user: CurrentUser = None,
    db: DbSession = None,
):
    """Generate a temporary download URL for a source file."""
    from apps.api.models.specification import SpecificationSource

    source = await db.get(SpecificationSource, source_id)
    if not source or not source.file_url:
        raise not_found("SpecificationSource")
    storage = GCSStorageService()
    gcs_path = source.file_url
    if gcs_path.startswith("gs://"):
        gcs_path = "/".join(gcs_path.split("/")[3:])
    return {"download_url": storage.generate_signed_url(gcs_path)}


@router.delete("/specification-sources/{source_id}", status_code=204)
async def delete_product_source(
    source_id: UUID,
    user: CurrentUser = None,
    service: ProductService = Depends(get_service),
):
    """Delete a specification source."""
    await service.delete_specification_source(source_id)
