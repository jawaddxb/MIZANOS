"""Global integration service — extracted from SettingsService."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.settings import GlobalIntegration, ProjectIntegration
from packages.common.utils.error_handlers import not_found


class GlobalIntegrationService:
    """CRUD for global and project-scoped integrations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_global(self) -> list[GlobalIntegration]:
        stmt = select(GlobalIntegration)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_global(self, data) -> GlobalIntegration:
        integration = GlobalIntegration(**data.model_dump())
        self.session.add(integration)
        await self.session.flush()
        await self.session.refresh(integration)
        return integration

    async def update_global(self, integration_id: UUID, data: dict) -> GlobalIntegration:
        integration = await self.session.get(GlobalIntegration, integration_id)
        if not integration:
            raise not_found("Integration")
        for key, value in data.items():
            if hasattr(integration, key):
                setattr(integration, key, value)
        await self.session.flush()
        await self.session.refresh(integration)
        return integration

    async def delete_global(self, integration_id: UUID) -> None:
        integration = await self.session.get(GlobalIntegration, integration_id)
        if not integration:
            raise not_found("Integration")
        await self.session.delete(integration)
        await self.session.flush()

    async def get_project(self, product_id: UUID) -> list[ProjectIntegration]:
        stmt = select(ProjectIntegration).where(ProjectIntegration.product_id == product_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_project(self, data) -> ProjectIntegration:
        integration = ProjectIntegration(**data.model_dump())
        self.session.add(integration)
        await self.session.flush()
        await self.session.refresh(integration)
        return integration
