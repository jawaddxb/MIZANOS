"""Base service class with generic CRUD logic (DRY)."""

from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.common.db.base import Base
from packages.common.db.repository import BaseRepository
from packages.common.utils.error_handlers import not_found

ModelT = TypeVar("ModelT", bound=Base)


class BaseService(Generic[ModelT]):
    """Generic service wrapping BaseRepository with error handling."""

    def __init__(self, model: type[ModelT], session: AsyncSession) -> None:
        self.repo = BaseRepository(model, session)
        self.model = model

    async def get_or_404(self, entity_id: UUID) -> ModelT:
        """Fetch entity by ID or raise 404."""
        entity = await self.repo.get_by_id(entity_id)
        if entity is None:
            raise not_found(self.model.__name__)
        return entity

    async def list(self, *, offset: int = 0, limit: int = 50) -> list[ModelT]:
        """List entities with pagination."""
        return await self.repo.get_all(offset=offset, limit=limit)

    async def count(self) -> int:
        """Count total entities."""
        return await self.repo.count()

    async def create(self, entity: ModelT) -> ModelT:
        """Create a new entity."""
        return await self.repo.create(entity)

    async def update(self, entity_id: UUID, data: dict) -> ModelT:
        """Update an entity by ID."""
        entity = await self.get_or_404(entity_id)
        return await self.repo.update(entity, data)

    async def delete(self, entity_id: UUID) -> None:
        """Delete an entity by ID."""
        entity = await self.get_or_404(entity_id)
        await self.repo.delete(entity)
