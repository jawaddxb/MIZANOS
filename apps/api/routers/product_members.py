"""Product members sub-router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.products import (
    ProductMemberAddRequest,
    ProductMemberResponse,
    TeamReadinessResponse,
)
from apps.api.services.product_member_service import ProductMemberService

router = APIRouter()


def get_member_service(db: DbSession) -> ProductMemberService:
    return ProductMemberService(db)


@router.get(
    "/all-members",
    response_model=list[ProductMemberResponse],
)
async def list_all_product_members(
    user: CurrentUser = None,
    svc: ProductMemberService = Depends(get_member_service),
):
    """List all product members across all products."""
    return await svc.get_all_members()


@router.get(
    "/{product_id}/members",
    response_model=list[ProductMemberResponse],
)
async def list_product_members(
    product_id: UUID,
    user: CurrentUser = None,
    svc: ProductMemberService = Depends(get_member_service),
):
    """List members for a product."""
    return await svc.get_members(product_id)


@router.post(
    "/{product_id}/members",
    response_model=ProductMemberResponse,
    status_code=201,
)
async def add_product_member(
    product_id: UUID,
    body: ProductMemberAddRequest,
    user: CurrentUser = None,
    svc: ProductMemberService = Depends(get_member_service),
):
    """Add a member to a product."""
    return await svc.add_member(
        product_id=product_id,
        profile_id=body.profile_id,
        role=body.role,
        actor=user,
    )


@router.delete("/{product_id}/members/{member_id}", status_code=204)
async def remove_product_member(
    product_id: UUID,
    member_id: UUID,
    user: CurrentUser = None,
    svc: ProductMemberService = Depends(get_member_service),
):
    """Remove a member from a product."""
    await svc.remove_member(product_id, member_id, actor=user)


@router.get(
    "/{product_id}/team-readiness",
    response_model=TeamReadinessResponse,
)
async def get_team_readiness(
    product_id: UUID,
    user: CurrentUser = None,
    svc: ProductMemberService = Depends(get_member_service),
):
    """Check team composition readiness for a product."""
    return await svc.validate_team_composition(product_id)
