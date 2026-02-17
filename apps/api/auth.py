"""Authorization helpers: role guards and product membership checks."""

from uuid import UUID

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.dependencies import AuthenticatedUser, DbSession, get_current_user
from apps.api.models.enums import AppRole
from packages.common.utils.error_handlers import forbidden


def require_roles(*allowed: AppRole):
    """FastAPI dependency factory — raises 403 if user lacks required role."""

    async def _guard(
        user: AuthenticatedUser = Depends(get_current_user),
    ) -> AuthenticatedUser:
        # super_admin bypasses all checks
        if user.has_role(AppRole.SUPERADMIN):
            return user
        # admin bypasses unless the check is specifically for superadmin
        if user.has_role(AppRole.ADMIN) and AppRole.SUPERADMIN not in allowed:
            return user
        if user.has_any_role(*allowed):
            return user
        raise forbidden("Insufficient permissions")

    return Depends(_guard)


def require_admin():
    """Shorthand: super_admin and admin pass."""
    return require_roles(AppRole.ADMIN)


def require_super_admin():
    """Only super_admin passes."""
    return require_roles(AppRole.SUPERADMIN)


async def verify_product_access(
    session: AsyncSession,
    user: AuthenticatedUser,
    product_id: UUID,
) -> None:
    """Raise 403 unless user is admin/superadmin or a member of the product."""
    if user.has_any_role(AppRole.SUPERADMIN, AppRole.ADMIN):
        return

    from apps.api.models.product import ProductMember

    result = await session.execute(
        select(ProductMember.id)
        .where(
            ProductMember.product_id == product_id,
            ProductMember.profile_id == user.profile_id,
        )
        .limit(1)
    )
    if result.scalar_one_or_none() is None:
        raise forbidden("Not a member of this product")
