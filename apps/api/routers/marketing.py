"""Marketing router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.marketing import (
    ChecklistItemCreate,
    ChecklistItemResponse,
    CredentialCreate,
    CredentialDecryptResponse,
    CredentialResponse,
    DomainCreate,
    DomainResponse,
    SocialHandleCreate,
    SocialHandleResponse,
)
from apps.api.services.marketing_service import MarketingService

router = APIRouter()


def get_service(db: DbSession) -> MarketingService:
    return MarketingService(db)


@router.get("/domains", response_model=list[DomainResponse])
async def list_domains(product_id: UUID, user: CurrentUser = None, service: MarketingService = Depends(get_service)):
    return await service.get_domains(product_id)


@router.post("/domains", response_model=DomainResponse, status_code=201)
async def create_domain(body: DomainCreate, user: CurrentUser = None, service: MarketingService = Depends(get_service)):
    return await service.create_domain(body)


@router.get("/social-handles", response_model=list[SocialHandleResponse])
async def list_social_handles(product_id: UUID, user: CurrentUser = None, service: MarketingService = Depends(get_service)):
    return await service.get_social_handles(product_id)


@router.post("/social-handles", response_model=SocialHandleResponse, status_code=201)
async def create_social_handle(body: SocialHandleCreate, user: CurrentUser = None, service: MarketingService = Depends(get_service)):
    return await service.create_social_handle(body)


@router.get("/checklist", response_model=list[ChecklistItemResponse])
async def list_checklist(product_id: UUID, user: CurrentUser = None, service: MarketingService = Depends(get_service)):
    return await service.get_checklist(product_id)


@router.post("/checklist", response_model=ChecklistItemResponse, status_code=201)
async def create_checklist_item(body: ChecklistItemCreate, user: CurrentUser = None, service: MarketingService = Depends(get_service)):
    return await service.create_checklist_item(body)


@router.patch("/checklist/{item_id}", response_model=ChecklistItemResponse)
async def toggle_checklist_item(item_id: UUID, user: CurrentUser = None, service: MarketingService = Depends(get_service)):
    return await service.toggle_checklist_item(item_id)


@router.post("/credentials", response_model=CredentialResponse, status_code=201)
async def create_credential(body: CredentialCreate, user: CurrentUser = None, service: MarketingService = Depends(get_service)):
    return await service.create_credential(body)


@router.get("/credentials", response_model=list[CredentialResponse])
async def list_credentials(product_id: UUID, user: CurrentUser = None, service: MarketingService = Depends(get_service)):
    return await service.get_credentials(product_id)


@router.get("/credentials/{credential_id}/decrypt", response_model=CredentialDecryptResponse)
async def decrypt_credential(credential_id: UUID, user: CurrentUser = None, service: MarketingService = Depends(get_service)):
    return await service.decrypt_credential(credential_id)
