"""GitHub PAT management router."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.github_pat import (
    GitHubPatCreate,
    GitHubPatResponse,
    GitHubPatUpdate,
    GitHubPatVerifyRequest,
    GitHubPatVerifyResponse,
)
from apps.api.services.github_pat_service import GitHubPatService

router = APIRouter()


def get_service(db: DbSession) -> GitHubPatService:
    return GitHubPatService(db)


@router.get("", response_model=list[GitHubPatResponse])
async def list_pats(
    user: CurrentUser,
    mine_only: bool = Query(False),
    service: GitHubPatService = Depends(get_service),
):
    """List GitHub PATs. Use mine_only=true to filter by current user."""
    created_by = user.profile_id if mine_only else None
    return await service.list_pats(created_by=created_by)


@router.post("/verify", response_model=GitHubPatVerifyResponse)
async def verify_pat(
    body: GitHubPatVerifyRequest,
    user: CurrentUser,
    service: GitHubPatService = Depends(get_service),
):
    """Verify a raw GitHub token."""
    return await service.verify_token(body.token)


@router.post("", response_model=GitHubPatResponse, status_code=201)
async def create_pat(
    body: GitHubPatCreate,
    user: CurrentUser,
    service: GitHubPatService = Depends(get_service),
):
    """Create a new GitHub PAT (verify + encrypt + store)."""
    return await service.create_pat(body, user.profile_id)


@router.patch("/{pat_id}", response_model=GitHubPatResponse)
async def update_pat(
    pat_id: UUID,
    body: GitHubPatUpdate,
    user: CurrentUser,
    service: GitHubPatService = Depends(get_service),
):
    """Update a GitHub PAT's label or active status."""
    return await service.update_pat(pat_id, body)


@router.post("/{pat_id}/check", response_model=GitHubPatVerifyResponse)
async def check_pat_status(
    pat_id: UUID,
    user: CurrentUser,
    service: GitHubPatService = Depends(get_service),
):
    """Check if a stored PAT is still valid and persist the result."""
    return await service.check_and_update_status(pat_id)


@router.delete("/{pat_id}", status_code=204)
async def delete_pat(
    pat_id: UUID,
    user: CurrentUser,
    service: GitHubPatService = Depends(get_service),
):
    """Delete a GitHub PAT."""
    await service.delete_pat(pat_id)
