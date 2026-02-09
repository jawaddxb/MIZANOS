"""Document service."""

import secrets
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import func

from apps.api.models.document import (
    DocumentAccessLink,
    DocumentFolder,
    DocumentVersion,
)
from apps.api.models.product import ProductDocument
from apps.api.schemas.documents import (
    AccessLinkCreate,
    DocumentCreate,
    FolderCreate,
    VersionCreate,
)
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

    async def get_versions(
        self, document_id: UUID
    ) -> list[DocumentVersion]:
        """List all versions for a document."""
        stmt = (
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version_number.desc())
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def create_version(
        self, document_id: UUID, data: VersionCreate
    ) -> DocumentVersion:
        """Create a new version for a document."""
        # Determine next version number
        stmt = select(func.coalesce(
            func.max(DocumentVersion.version_number), 0
        )).where(DocumentVersion.document_id == document_id)
        result = await self.repo.session.execute(stmt)
        next_version = result.scalar_one() + 1

        # Mark previous versions as not current
        prev_stmt = (
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .where(DocumentVersion.is_current.is_(True))
        )
        prev_result = await self.repo.session.execute(prev_stmt)
        for prev in prev_result.scalars().all():
            prev.is_current = False

        version = DocumentVersion(
            document_id=document_id,
            version_number=next_version,
            is_current=True,
            **data.model_dump(),
        )
        self.repo.session.add(version)
        await self.repo.session.flush()
        await self.repo.session.refresh(version)
        return version

    async def generate_summary(self, doc_id: UUID) -> ProductDocument:
        """Generate AI summary for a document (placeholder)."""
        doc = await self.repo.session.get(ProductDocument, doc_id)
        if not doc:
            raise not_found("Document")
        doc.ai_summary = (
            f"AI-generated summary for '{doc.file_name}'. "
            "Full AI integration coming soon."
        )
        doc.summary_generated_at = datetime.now(timezone.utc)
        await self.repo.session.flush()
        await self.repo.session.refresh(doc)
        return doc

    async def restore_version(
        self, version_id: UUID
    ) -> DocumentVersion:
        """Restore a specific version as current."""
        version = await self.repo.session.get(
            DocumentVersion, version_id
        )
        if version is None:
            raise not_found("DocumentVersion")

        # Unset all current versions for this document
        stmt = (
            select(DocumentVersion)
            .where(DocumentVersion.document_id == version.document_id)
            .where(DocumentVersion.is_current.is_(True))
        )
        result = await self.repo.session.execute(stmt)
        for v in result.scalars().all():
            v.is_current = False

        version.is_current = True
        await self.repo.session.flush()
        await self.repo.session.refresh(version)
        return version
