"""Documents router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.documents import (
    AccessLinkCreate,
    AccessLinkResponse,
    DocumentCreate,
    DocumentResponse,
    FolderCreate,
    FolderResponse,
)
from apps.api.services.document_service import DocumentService

router = APIRouter()


def get_service(db: DbSession) -> DocumentService:
    return DocumentService(db)


@router.get("", response_model=list[DocumentResponse])
async def list_documents(product_id: UUID, user: CurrentUser = None, service: DocumentService = Depends(get_service)):
    return await service.get_by_product(product_id)


@router.post("", response_model=DocumentResponse, status_code=201)
async def create_document(body: DocumentCreate, user: CurrentUser = None, service: DocumentService = Depends(get_service)):
    return await service.create_document(body)


@router.delete("/{doc_id}", status_code=204)
async def delete_document(doc_id: UUID, user: CurrentUser = None, service: DocumentService = Depends(get_service)):
    await service.delete(doc_id)


@router.get("/folders", response_model=list[FolderResponse])
async def list_folders(product_id: UUID, user: CurrentUser = None, service: DocumentService = Depends(get_service)):
    return await service.get_folders(product_id)


@router.post("/folders", response_model=FolderResponse, status_code=201)
async def create_folder(body: FolderCreate, user: CurrentUser = None, service: DocumentService = Depends(get_service)):
    return await service.create_folder(body)


@router.post("/access-links", response_model=AccessLinkResponse, status_code=201)
async def create_access_link(body: AccessLinkCreate, user: CurrentUser = None, service: DocumentService = Depends(get_service)):
    return await service.create_access_link(body)


@router.get("/shared/{token}", response_model=list[DocumentResponse])
async def get_shared_documents(token: str, service: DocumentService = Depends(get_service)):
    """Public endpoint: get documents by share token."""
    return await service.get_by_share_token(token)
