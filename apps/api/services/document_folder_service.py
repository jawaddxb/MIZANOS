"""Document folder service."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.document import DocumentFolder
from packages.common.utils.error_handlers import not_found


class DocumentFolderService:
    """Document folder business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def update(self, folder_id: UUID, data) -> DocumentFolder:
        folder = await self.session.get(DocumentFolder, folder_id)
        if not folder:
            raise not_found("Document folder")
        for key, value in data.model_dump(exclude_unset=True).items():
            if hasattr(folder, key):
                setattr(folder, key, value)
        await self.session.flush()
        await self.session.refresh(folder)
        return folder

    async def delete(self, folder_id: UUID) -> None:
        folder = await self.session.get(DocumentFolder, folder_id)
        if not folder:
            raise not_found("Document folder")
        await self.session.delete(folder)
        await self.session.flush()
