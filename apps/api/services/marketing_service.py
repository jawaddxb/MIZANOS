"""Marketing service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.marketing import (
    MarketingChecklistItem,
    MarketingDomain,
    MarketingSocialHandle,
)
from packages.common.utils.error_handlers import not_found


class MarketingService:
    """Marketing assets management."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_domains(self, product_id: UUID) -> list[MarketingDomain]:
        stmt = select(MarketingDomain).where(MarketingDomain.product_id == product_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_domain(self, data) -> MarketingDomain:
        domain = MarketingDomain(**data.model_dump())
        self.session.add(domain)
        await self.session.flush()
        await self.session.refresh(domain)
        return domain

    async def get_social_handles(self, product_id: UUID) -> list[MarketingSocialHandle]:
        stmt = select(MarketingSocialHandle).where(MarketingSocialHandle.product_id == product_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_social_handle(self, data) -> MarketingSocialHandle:
        handle = MarketingSocialHandle(**data.model_dump())
        self.session.add(handle)
        await self.session.flush()
        await self.session.refresh(handle)
        return handle

    async def get_checklist(self, product_id: UUID) -> list[MarketingChecklistItem]:
        stmt = (
            select(MarketingChecklistItem)
            .where(MarketingChecklistItem.product_id == product_id)
            .order_by(MarketingChecklistItem.sort_order)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_checklist_item(self, data) -> MarketingChecklistItem:
        item = MarketingChecklistItem(**data.model_dump())
        self.session.add(item)
        await self.session.flush()
        await self.session.refresh(item)
        return item

    async def toggle_checklist_item(self, item_id: UUID) -> MarketingChecklistItem:
        item = await self.session.get(MarketingChecklistItem, item_id)
        if not item:
            raise not_found("Checklist item")
        item.is_completed = not item.is_completed
        await self.session.flush()
        await self.session.refresh(item)
        return item
