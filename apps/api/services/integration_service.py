"""Project integration service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.settings import ProjectIntegration
from packages.common.utils.error_handlers import not_found


class IntegrationService:
    """Project integration business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_product(
        self, product_id: UUID
    ) -> list[ProjectIntegration]:
        stmt = (
            select(ProjectIntegration)
            .where(ProjectIntegration.product_id == product_id)
            .order_by(ProjectIntegration.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(
        self, product_id: UUID, data
    ) -> ProjectIntegration:
        integration = ProjectIntegration(
            product_id=product_id,
            **data.model_dump(exclude_unset=True),
        )
        self.session.add(integration)
        await self.session.flush()
        await self.session.refresh(integration)
        return integration

    async def update(
        self, integration_id: UUID, data
    ) -> ProjectIntegration:
        integration = await self.session.get(
            ProjectIntegration, integration_id
        )
        if not integration:
            raise not_found("ProjectIntegration")
        for key, value in data.model_dump(exclude_unset=True).items():
            if hasattr(integration, key):
                setattr(integration, key, value)
        await self.session.flush()
        await self.session.refresh(integration)
        return integration

    async def delete(self, integration_id: UUID) -> None:
        integration = await self.session.get(
            ProjectIntegration, integration_id
        )
        if not integration:
            raise not_found("ProjectIntegration")
        await self.session.delete(integration)
        await self.session.flush()
