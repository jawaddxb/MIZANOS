"""Org-level settings service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.settings import OrgSetting
from packages.common.utils.error_handlers import not_found


class OrgSettingsService:
    """Manages org-wide key-value settings."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_all(self) -> list[OrgSetting]:
        stmt = select(OrgSetting).order_by(OrgSetting.key)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(
        self, key: str, value: dict, updated_by: UUID,
    ) -> OrgSetting:
        stmt = select(OrgSetting).where(OrgSetting.key == key)
        result = await self.session.execute(stmt)
        setting = result.scalar_one_or_none()
        if not setting:
            raise not_found("OrgSetting")
        setting.value = value
        setting.updated_by = updated_by
        await self.session.flush()
        await self.session.refresh(setting)
        return setting
