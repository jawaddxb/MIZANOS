"""Document service."""

import secrets
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.document import DocumentAccessLink, DocumentFolder
from apps.api.models.product import ProductDocument
from apps.api.schemas.documents import AccessLinkCreate, DocumentCreate, FolderCreate
from apps.api.services.base_service import BaseService
from packages.common.utils.error_handlers import not_found


class DocumentService(BaseService[ProductDocument]):
    """Document management business logic."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ProductDocument, session)

    async def get_by_product(self, product_id: UUID) -> list[ProductDocument]:
        stmt = select(ProductDocument).where(ProductDocument.product_id == product_id)
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def create_document(self, data: DocumentCreate) -> ProductDocument:
        doc = ProductDocument(**data.model_dump())
        return await self.repo.create(doc)

    async def get_folders(self, product_id: UUID) -> list[DocumentFolder]:
        stmt = select(DocumentFolder).where(DocumentFolder.product_id == product_id)
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def create_folder(self, data: FolderCreate) -> DocumentFolder:
        folder = DocumentFolder(**data.model_dump())
        self.repo.session.add(folder)
        await self.repo.session.flush()
        await self.repo.session.refresh(folder)
        return folder

    async def create_access_link(self, data: AccessLinkCreate) -> DocumentAccessLink:
        link = DocumentAccessLink(
            **data.model_dump(),
            token=secrets.token_urlsafe(32),
        )
        self.repo.session.add(link)
        await self.repo.session.flush()
        await self.repo.session.refresh(link)
        return link

    async def get_by_share_token(self, token: str) -> list[ProductDocument]:
        stmt = select(DocumentAccessLink).where(DocumentAccessLink.token == token)
        result = await self.repo.session.execute(stmt)
        link = result.scalar_one_or_none()
        if not link:
            raise not_found("Share link")
        return await self.get_by_product(link.product_id)
