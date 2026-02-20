"""Vault (credentials) router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.vault import CredentialCreate, CredentialResponse, CredentialUpdate
from apps.api.services.vault_service import VaultService

router = APIRouter()


def get_service(db: DbSession) -> VaultService:
    return VaultService(db)


@router.get("", response_model=list[CredentialResponse])
async def list_credentials(
    user: CurrentUser,
    category: str | None = None,
    service: VaultService = Depends(get_service),
):
    return await service.list_credentials(category=category)


@router.get("/{cred_id}", response_model=CredentialResponse)
async def get_credential(cred_id: UUID, user: CurrentUser, service: VaultService = Depends(get_service)):
    return await service.get_or_404(cred_id)


@router.post("", response_model=CredentialResponse, status_code=201)
async def create_credential(body: CredentialCreate, user: CurrentUser, service: VaultService = Depends(get_service)):
    return await service.create_credential(body, user.id)


@router.patch("/{cred_id}", response_model=CredentialResponse)
async def update_credential(cred_id: UUID, body: CredentialUpdate, user: CurrentUser, service: VaultService = Depends(get_service)):
    return await service.update_credential(cred_id, body, user.id)


@router.delete("/{cred_id}", status_code=204)
async def delete_credential(cred_id: UUID, user: CurrentUser, service: VaultService = Depends(get_service)):
    await service.delete(cred_id)
