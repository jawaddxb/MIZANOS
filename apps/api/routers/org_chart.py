"""Org chart router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.models.enums import AppRole
from apps.api.schemas.base import MessageResponse
from apps.api.schemas.org_chart import (
    OrgChartNodeResponse,
    UpdateReportingLineRequest,
)
from apps.api.services.org_chart_service import OrgChartService
from packages.common.utils.error_handlers import forbidden

router = APIRouter()


def get_service(db: DbSession) -> OrgChartService:
    return OrgChartService(db)


def require_super_admin(user: CurrentUser) -> None:
    if not user.has_role(AppRole.SUPER_ADMIN):
        raise forbidden("Only super admins can modify reporting lines")


def require_admin_or_pm(user: CurrentUser) -> None:
    if not user.has_any_role(AppRole.SUPER_ADMIN, AppRole.ADMIN, AppRole.PM):
        raise forbidden("Insufficient permissions to resend invitations")


@router.get("", response_model=list[OrgChartNodeResponse])
async def get_org_chart(
    user: CurrentUser,
    service: OrgChartService = Depends(get_service),
):
    """Return the flat list of all profiles for the org chart."""
    return await service.get_org_tree()


@router.patch("/{profile_id}/reporting-line", response_model=MessageResponse)
async def update_reporting_line(
    profile_id: UUID,
    body: UpdateReportingLineRequest,
    user: CurrentUser,
    service: OrgChartService = Depends(get_service),
):
    """Update who a profile reports to (super_admin only)."""
    require_super_admin(user)
    return await service.update_reporting_line(profile_id, body.manager_id)


@router.post("/{profile_id}/resend-invite", response_model=MessageResponse)
async def resend_invite(
    profile_id: UUID,
    user: CurrentUser,
    service: OrgChartService = Depends(get_service),
):
    """Resend an invitation email to a pending user."""
    require_admin_or_pm(user)
    inviter_name = user.email.split("@")[0] if user.email else "Admin"
    return await service.resend_invite(profile_id, inviter_name)
