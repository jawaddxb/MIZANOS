"""Standards repository service — extracted from SettingsService."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.settings import StandardsRepository
from packages.common.utils.error_handlers import not_found


class StandardsService:
    """CRUD for standards repositories."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_all(self) -> list[StandardsRepository]:
        stmt = select(StandardsRepository).order_by(StandardsRepository.name)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, data, created_by: UUID) -> StandardsRepository:
        repo = StandardsRepository(**data.model_dump(), created_by=created_by)
        self.session.add(repo)
        await self.session.flush()
        await self.session.refresh(repo)
        return repo

    async def update(self, repo_id: UUID, data: dict) -> StandardsRepository:
        repo = await self.session.get(StandardsRepository, repo_id)
        if not repo:
            raise not_found("Standards repository")
        for key, value in data.items():
            if hasattr(repo, key):
                setattr(repo, key, value)
        await self.session.flush()
        await self.session.refresh(repo)
        return repo

    async def delete(self, repo_id: UUID) -> None:
        repo = await self.session.get(StandardsRepository, repo_id)
        if not repo:
            raise not_found("Standards repository")
        await self.session.delete(repo)
        await self.session.flush()
