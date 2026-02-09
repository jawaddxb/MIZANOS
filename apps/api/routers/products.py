"""Products router."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.models.specification import SpecificationFeature, SpecificationSource
from apps.api.schemas.products import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
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
    user: CurrentUser = None,
    service: ProductService = Depends(get_service),
):
    """List products with pagination and filtering."""
    return await service.list_products(
        page=page, page_size=page_size, status=status, search=search
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    user: CurrentUser = None,
    service: ProductService = Depends(get_service),
):
    """Get a product by ID."""
    return await service.get_or_404(product_id)


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    body: ProductCreate,
    user: CurrentUser = None,
    service: ProductService = Depends(get_service),
):
    """Create a new product."""
    return await service.create_product(body)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    body: ProductUpdate,
    user: CurrentUser = None,
    service: ProductService = Depends(get_service),
):
    """Update a product."""
    return await service.update(product_id, body.model_dump(exclude_unset=True))


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: UUID,
    user: CurrentUser = None,
    service: ProductService = Depends(get_service),
):
    """Delete a product."""
    await service.delete(product_id)


@router.get("/{product_id}/specification-features")
async def list_product_features(
    product_id: UUID,
    user: CurrentUser = None,
    db: DbSession = None,
):
    """Get all specification features for a product."""
    stmt = (
        select(SpecificationFeature)
        .where(SpecificationFeature.product_id == product_id)
        .order_by(SpecificationFeature.sort_order)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{product_id}/specification-sources")
async def list_product_sources(
    product_id: UUID,
    user: CurrentUser = None,
    db: DbSession = None,
):
    """Get all specification sources for a product."""
    stmt = (
        select(SpecificationSource)
        .where(SpecificationSource.product_id == product_id)
        .order_by(SpecificationSource.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
