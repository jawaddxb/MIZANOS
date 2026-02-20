"""Products router."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.auth import require_admin, require_roles
from apps.api.dependencies import AuthenticatedUser, CurrentUser, DbSession
from apps.api.models.enums import AppRole
from apps.api.schemas.products import (
    ManagementNoteCreate,
    ManagementNoteResponse,
    PartnerNoteCreate,
    PartnerNoteResponse,
    ProductCreate,
    ProductEnvironmentResponse,
    ProductEnvironmentUpsert,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
    SpecificationSourceCreate,
    SpecificationSourceResponse,
)
from apps.api.services.product_service import ProductService

router = APIRouter()


def get_service(db: DbSession) -> ProductService:
    return ProductService(db)


@router.get("", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status: str | None = None,
    search: str | None = None,
    include_archived: bool = Query(False),
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """List products with pagination and filtering."""
    return await service.list_products(
        page=page,
        page_size=page_size,
        status=status,
        search=search,
        include_archived=include_archived,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """Get a product by ID."""
    return await service.get_or_404(product_id)


@router.get(
    "/{product_id}/environments",
    response_model=list[ProductEnvironmentResponse],
)
async def list_product_environments(
    product_id: UUID,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """List environments for a product."""
    return await service.get_environments(product_id)


@router.put(
    "/{product_id}/environments",
    response_model=ProductEnvironmentResponse,
)
async def upsert_product_environment(
    product_id: UUID,
    body: ProductEnvironmentUpsert,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """Create or update an environment for a product."""
    return await service.upsert_environment(product_id, body)


@router.delete(
    "/{product_id}/environments/{env_type}",
    status_code=204,
)
async def delete_product_environment(
    product_id: UUID,
    env_type: str,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """Delete an environment by type."""
    await service.delete_environment(product_id, env_type)


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    body: ProductCreate,
    user: AuthenticatedUser = require_roles(AppRole.PM),
    service: ProductService = Depends(get_service),
):
    """Create a new product."""
    return await service.create_product(body)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    body: ProductUpdate,
    user: AuthenticatedUser = require_roles(AppRole.PM),
    service: ProductService = Depends(get_service),
):
    """Update a product."""
    return await service.update(product_id, body.model_dump(exclude_unset=True))


@router.post("/{product_id}/archive", response_model=ProductResponse)
async def archive_product(
    product_id: UUID,
    user: AuthenticatedUser = require_admin(),
    service: ProductService = Depends(get_service),
):
    """Archive a product (soft-delete)."""
    return await service.archive(product_id)


@router.post("/{product_id}/unarchive", response_model=ProductResponse)
async def unarchive_product(
    product_id: UUID,
    user: AuthenticatedUser = require_admin(),
    service: ProductService = Depends(get_service),
):
    """Restore an archived product."""
    return await service.unarchive(product_id)


@router.get(
    "/{product_id}/management-notes",
    response_model=list[ManagementNoteResponse],
)
async def list_management_notes(
    product_id: UUID,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """List management notes for a product."""
    return await service.get_management_notes(product_id)


@router.post(
    "/{product_id}/management-notes",
    response_model=ManagementNoteResponse,
    status_code=201,
)
async def create_management_note(
    product_id: UUID,
    body: ManagementNoteCreate,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """Create a management note."""
    return await service.create_management_note(product_id, body)


@router.delete("/management-notes/{note_id}", status_code=204)
async def delete_management_note(
    note_id: UUID,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """Delete a management note."""
    await service.delete_management_note(note_id)


@router.patch(
    "/management-notes/{note_id}/pin",
    response_model=ManagementNoteResponse,
)
async def toggle_pin_management_note(
    note_id: UUID,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """Toggle pin status of a management note."""
    return await service.toggle_management_note_pin(note_id)


@router.get(
    "/{product_id}/partner-notes",
    response_model=list[PartnerNoteResponse],
)
async def list_partner_notes(
    product_id: UUID,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """List partner notes for a product."""
    return await service.get_partner_notes(product_id)


@router.post(
    "/{product_id}/partner-notes",
    response_model=PartnerNoteResponse,
    status_code=201,
)
async def create_partner_note(
    product_id: UUID,
    body: PartnerNoteCreate,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """Create a partner note."""
    return await service.create_partner_note(product_id, body)


@router.delete("/partner-notes/{note_id}", status_code=204)
async def delete_partner_note(
    note_id: UUID,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """Delete a partner note."""
    await service.delete_partner_note(note_id)


@router.get("/{product_id}/specification-features")
async def list_product_features(
    product_id: UUID,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """Get all specification features for a product."""
    return await service.get_specification_features(product_id)


@router.get(
    "/{product_id}/specification-sources",
    response_model=list[SpecificationSourceResponse],
)
async def list_product_sources(
    product_id: UUID,
    user: CurrentUser,
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
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """Create a specification source for a product."""
    return await service.create_specification_source(product_id, body)


@router.delete("/specification-sources/{source_id}", status_code=204)
async def delete_product_source(
    source_id: UUID,
    user: CurrentUser,
    service: ProductService = Depends(get_service),
):
    """Delete a specification source."""
    await service.delete_specification_source(source_id)
