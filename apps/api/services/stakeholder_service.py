"""Stakeholder service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.project import ProjectStakeholder
from packages.common.utils.error_handlers import not_found


class StakeholderService:
    """Project stakeholder business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_product(
        self, product_id: UUID
    ) -> list[ProjectStakeholder]:
        stmt = (
            select(ProjectStakeholder)
            .where(ProjectStakeholder.product_id == product_id)
            .order_by(ProjectStakeholder.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(
        self, product_id: UUID, data
    ) -> ProjectStakeholder:
        stakeholder = ProjectStakeholder(
            product_id=product_id,
            **data.model_dump(exclude_unset=True),
        )
        self.session.add(stakeholder)
        await self.session.flush()
        await self.session.refresh(stakeholder)
        return stakeholder

    async def update(
        self, stakeholder_id: UUID, data
    ) -> ProjectStakeholder:
        stakeholder = await self.session.get(
            ProjectStakeholder, stakeholder_id
        )
        if not stakeholder:
            raise not_found("Stakeholder")
        for key, value in data.model_dump(exclude_unset=True).items():
            if hasattr(stakeholder, key):
                setattr(stakeholder, key, value)
        await self.session.flush()
        await self.session.refresh(stakeholder)
        return stakeholder

    async def delete(self, stakeholder_id: UUID) -> None:
        stakeholder = await self.session.get(
            ProjectStakeholder, stakeholder_id
        )
        if not stakeholder:
            raise not_found("Stakeholder")
        await self.session.delete(stakeholder)
        await self.session.flush()
