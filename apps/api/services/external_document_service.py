"""External document link service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.document import ExternalDocumentLink
from packages.common.utils.error_handlers import not_found


class ExternalDocumentService:
    """External document link business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_product(
        self, product_id: UUID
    ) -> list[ExternalDocumentLink]:
        stmt = (
            select(ExternalDocumentLink)
            .where(ExternalDocumentLink.product_id == product_id)
            .order_by(ExternalDocumentLink.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(
        self, product_id: UUID, created_by: UUID, data
    ) -> ExternalDocumentLink:
        link = ExternalDocumentLink(
            product_id=product_id,
            created_by=created_by,
            **data.model_dump(exclude_unset=True),
        )
        self.session.add(link)
        await self.session.flush()
        await self.session.refresh(link)
        return link

    async def delete(self, document_id: UUID) -> None:
        link = await self.session.get(ExternalDocumentLink, document_id)
        if not link:
            raise not_found("External document link")
        await self.session.delete(link)
        await self.session.flush()
