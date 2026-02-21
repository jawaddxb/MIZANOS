"""Product notification settings service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.dependencies import AuthenticatedUser
from apps.api.models.enums import AppRole
from apps.api.models.product import ProductMember, ProductNotificationSetting
from packages.common.utils.error_handlers import forbidden


class ProductNotificationSettingService:
    """Manages product-level notification settings."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_setting(self, product_id: UUID) -> dict:
        """Return notification setting for a product (defaults if none)."""
        stmt = select(ProductNotificationSetting).where(
            ProductNotificationSetting.product_id == product_id
        )
        result = await self.session.execute(stmt)
        setting = result.scalar_one_or_none()
        if setting:
            return {"product_id": product_id, "email_enabled": setting.email_enabled}
        return {"product_id": product_id, "email_enabled": True}

    async def update_setting(
        self, product_id: UUID, email_enabled: bool, user: AuthenticatedUser
    ) -> dict:
        """Upsert notification setting. PM/admin/superadmin auth check."""
        if not self._has_global_permission(user):
            pm_stmt = select(ProductMember.id).where(
                ProductMember.product_id == product_id,
                ProductMember.profile_id == user.profile_id,
                ProductMember.role == "project_manager",
            ).limit(1)
            pm_result = await self.session.execute(pm_stmt)
            if pm_result.scalar_one_or_none() is None:
                raise forbidden("Only project managers can update notification settings")

        stmt = select(ProductNotificationSetting).where(
            ProductNotificationSetting.product_id == product_id
        )
        result = await self.session.execute(stmt)
        setting = result.scalar_one_or_none()
        if setting:
            setting.email_enabled = email_enabled
        else:
            setting = ProductNotificationSetting(
                product_id=product_id, email_enabled=email_enabled
            )
            self.session.add(setting)
        await self.session.flush()
        await self.session.refresh(setting)
        return {"product_id": product_id, "email_enabled": setting.email_enabled}

    @staticmethod
    def _has_global_permission(user: AuthenticatedUser) -> bool:
        return user.has_any_role(
            AppRole.SUPERADMIN, AppRole.ADMIN, AppRole.PROJECT_MANAGER
        )
