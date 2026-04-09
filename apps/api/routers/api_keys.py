"""API key management router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.api_key import (
    ApiKeyCreate,
    ApiKeyCreateResponse,
    ApiKeyResponse,
    ApiKeyUpdate,
)
from apps.api.services.api_key_service import ApiKeyService

router = APIRouter()


def _get_service(db: DbSession) -> ApiKeyService:
    return ApiKeyService(db)


@router.post("", response_model=ApiKeyCreateResponse, status_code=201)
async def create_api_key(
    body: ApiKeyCreate,
    user: CurrentUser,
    service: ApiKeyService = Depends(_get_service),
):
    """Create a new API key. The raw key is returned ONCE — save it immediately."""
    if not user.profile_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Profile not found for current user")
    api_key, raw_key = await service.create_key(body.label, user.profile_id)
    data = ApiKeyResponse.model_validate(api_key).model_dump()
    data["raw_key"] = raw_key
    return ApiKeyCreateResponse(**data)


@router.get("", response_model=list[ApiKeyResponse])
async def list_api_keys(
    user: CurrentUser,
    service: ApiKeyService = Depends(_get_service),
):
    """List all API keys for the current user."""
    return await service.list_keys(user.profile_id)


@router.get("/{key_id}/reveal")
async def reveal_api_key(
    key_id: UUID,
    user: CurrentUser,
    service: ApiKeyService = Depends(_get_service),
):
    """Reveal the full API key (decrypted)."""
    raw_key = await service.reveal_key(key_id)
    return {"raw_key": raw_key}


@router.patch("/{key_id}", response_model=ApiKeyResponse)
async def update_api_key(
    key_id: UUID,
    body: ApiKeyUpdate,
    user: CurrentUser,
    service: ApiKeyService = Depends(_get_service),
):
    """Update an API key's label or active status."""
    return await service.update_key(key_id, label=body.label, is_active=body.is_active)


@router.delete("/{key_id}")
async def delete_api_key(
    key_id: UUID,
    user: CurrentUser,
    service: ApiKeyService = Depends(_get_service),
):
    """Delete an API key."""
    await service.delete_key(key_id)
    return {"ok": True}
