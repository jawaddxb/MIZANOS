"""GitHub integration router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.github import (
    GitHubConnectionResponse,
    GitHubOAuthCallback,
    RepoAnalysisRequest,
    RepoAnalysisResponse,
)
from apps.api.services.github_service import GitHubService

router = APIRouter()


def get_service(db: DbSession) -> GitHubService:
    return GitHubService(db)


@router.get("/connections", response_model=list[GitHubConnectionResponse])
async def list_connections(user: CurrentUser = None, service: GitHubService = Depends(get_service)):
    return await service.get_connections(user["id"])


@router.get("/oauth/url")
async def get_oauth_url(service: GitHubService = Depends(get_service)):
    return {"url": service.get_oauth_url()}


@router.post("/oauth/callback")
async def oauth_callback(body: GitHubOAuthCallback, user: CurrentUser = None, service: GitHubService = Depends(get_service)):
    return await service.handle_callback(user["id"], body.code, body.state)


@router.delete("/disconnect")
async def disconnect(user: CurrentUser = None, service: GitHubService = Depends(get_service)):
    await service.disconnect(user["id"])
    return {"message": "Disconnected"}


@router.get("/repos")
async def list_repos(user: CurrentUser = None, service: GitHubService = Depends(get_service)):
    return await service.list_repos(user["id"])


@router.post("/analyze", response_model=RepoAnalysisResponse)
async def analyze_repo(body: RepoAnalysisRequest, user: CurrentUser = None, service: GitHubService = Depends(get_service)):
    return await service.analyze_repo(body.product_id, body.repository_url)
