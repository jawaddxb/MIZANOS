"""Service for uploading source documents (GCS + text extraction)."""

import logging
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.specification import SpecificationSource
from apps.api.services.gcs_storage_service import GCSStorageService
from apps.api.services.text_extraction_service import can_extract_text, extract_text
from packages.common.utils.error_handlers import bad_request

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


class SourceUploadService:
    """Orchestrates file upload to GCS with text extraction."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.storage = GCSStorageService()

    async def upload_source(
        self,
        product_id: UUID,
        file: UploadFile,
    ) -> SpecificationSource:
        """Upload a binary file, extract text, and create a DB record."""
        content = await file.read()
        file_name = file.filename or "untitled"
        content_type = file.content_type or "application/octet-stream"

        if len(content) > MAX_FILE_SIZE:
            raise bad_request("File must be under 25 MB")

        dest_path = GCSStorageService.build_source_path(str(product_id), file_name)
        file_url = await self.storage.upload_file(content, dest_path, content_type)

        raw_content: str | None = None
        if can_extract_text(content_type, file_name):
            raw_content = extract_text(content, file_name) or None

        source = SpecificationSource(
            product_id=product_id,
            source_type="document",
            file_name=file_name,
            file_url=file_url,
            raw_content=raw_content,
        )
        self.session.add(source)
        await self.session.flush()
        await self.session.refresh(source)
        return source
