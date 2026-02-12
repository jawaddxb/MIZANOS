"""Document folders router (PATCH/DELETE only)."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.documents import FolderResponse, FolderUpdate
from apps.api.services.document_folder_service import DocumentFolderService

router = APIRouter()


def get_service(db: DbSession) -> DocumentFolderService:
    return DocumentFolderService(db)


@router.patch(
    "/{product_id}/document-folders/{folder_id}",
    response_model=FolderResponse,
)
async def update_folder(
    product_id: UUID,
    folder_id: UUID,
    body: FolderUpdate,
    user: CurrentUser = None,
    service: DocumentFolderService = Depends(get_service),
):
    return await service.update(folder_id, body)


@router.delete(
    "/{product_id}/document-folders/{folder_id}",
    status_code=204,
)
async def delete_folder(
    product_id: UUID,
    folder_id: UUID,
    user: CurrentUser = None,
    service: DocumentFolderService = Depends(get_service),
):
    await service.delete(folder_id)
