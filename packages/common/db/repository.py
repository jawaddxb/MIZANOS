"""Base repository implementing generic CRUD operations (DRY)."""

from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from packages.common.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """Generic async repository with CRUD operations."""

    def __init__(self, model: type[ModelT], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def get_by_id(self, entity_id: UUID) -> ModelT | None:
        """Fetch a single entity by ID."""
        return await self.session.get(self.model, entity_id)

    async def get_all(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> list[ModelT]:
        """Fetch a paginated list of entities."""
        stmt = select(self.model).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self) -> int:
        """Count total entities."""
        stmt = select(func.count()).select_from(self.model)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def create(self, entity: ModelT) -> ModelT:
        """Insert a new entity."""
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update(self, entity: ModelT, data: dict) -> ModelT:
        """Update an existing entity with the given data dict."""
        for key, value in data.items():
            if hasattr(entity, key):
                setattr(entity, key, value)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: ModelT) -> None:
        """Delete an entity."""
        await self.session.delete(entity)
        await self.session.flush()
