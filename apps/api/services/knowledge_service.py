"""Knowledge service."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.knowledge import KnowledgeEntry
from apps.api.schemas.knowledge import KnowledgeCreate
from apps.api.services.base_service import BaseService


class KnowledgeService(BaseService[KnowledgeEntry]):
    """Knowledge base business logic."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(KnowledgeEntry, session)

    async def list_entries(
        self, *, category: str | None = None, search: str | None = None
    ) -> list[KnowledgeEntry]:
        stmt = select(KnowledgeEntry)
        if category:
            stmt = stmt.where(KnowledgeEntry.category == category)
        if search:
            stmt = stmt.where(KnowledgeEntry.title.ilike(f"%{search}%"))
        stmt = stmt.order_by(KnowledgeEntry.created_at.desc())
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def create_entry(self, data: KnowledgeCreate) -> KnowledgeEntry:
        entry = KnowledgeEntry(**data.model_dump())
        return await self.repo.create(entry)
