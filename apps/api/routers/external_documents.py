"""External document links router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.external_documents import (
    ExternalDocumentCreate,
    ExternalDocumentResponse,
)
from apps.api.services.external_document_service import ExternalDocumentService

router = APIRouter()


def get_service(db: DbSession) -> ExternalDocumentService:
    return ExternalDocumentService(db)


@router.get(
    "/{product_id}/external-documents",
    response_model=list[ExternalDocumentResponse],
)
async def list_external_documents(
    product_id: UUID,
    user: CurrentUser,
    service: ExternalDocumentService = Depends(get_service),
):
    return await service.get_by_product(product_id)


@router.post(
    "/{product_id}/external-documents",
    response_model=ExternalDocumentResponse,
    status_code=201,
)
async def create_external_document(
    product_id: UUID,
    body: ExternalDocumentCreate,
    user: CurrentUser,
    service: ExternalDocumentService = Depends(get_service),
):
    created_by = UUID(user.id) if user else None
    return await service.create(product_id, created_by, body)


@router.delete(
    "/{product_id}/external-documents/{document_id}",
    status_code=204,
)
async def delete_external_document(
    product_id: UUID,
    document_id: UUID,
    user: CurrentUser,
    service: ExternalDocumentService = Depends(get_service),
):
    await service.delete(document_id)
