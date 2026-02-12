"""GitHub integration router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.github import (
    GitHubConnectionResponse,
    GitHubOAuthCallback,
    RepoAnalysisRequest,
    RepoAnalysisResponse,
    RepoInfoRequest,
    RepoInfoResponse,
    RepoScanHistoryResponse,
    ScanRequest,
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


@router.delete("/connections/{connection_id}", status_code=204)
async def disconnect_by_id(connection_id: UUID, user: CurrentUser = None, service: GitHubService = Depends(get_service)):
    await service.disconnect_by_id(connection_id)


@router.post("/analyze", response_model=RepoAnalysisResponse)
async def analyze_repo(body: RepoAnalysisRequest, user: CurrentUser = None, service: GitHubService = Depends(get_service)):
    return await service.analyze_repo(body.product_id, body.repository_url)


@router.get("/scans", response_model=list[RepoScanHistoryResponse])
async def list_scans(product_id: UUID, user: CurrentUser = None, service: GitHubService = Depends(get_service)):
    return await service.get_scan_history(product_id)


@router.get("/analysis/{product_id}", response_model=RepoAnalysisResponse | None)
async def get_analysis(product_id: UUID, user: CurrentUser = None, service: GitHubService = Depends(get_service)):
    return await service.get_latest_analysis(product_id)


@router.post("/repo-info", response_model=RepoInfoResponse)
async def get_repo_info(body: RepoInfoRequest, user: CurrentUser = None, service: GitHubService = Depends(get_service)):
    return await service.get_repo_info(body.repository_url, body.github_token)


@router.post("/scan")
async def trigger_scan(body: ScanRequest, user: CurrentUser = None, service: GitHubService = Depends(get_service)):
    return await service.trigger_scan(body.product_id)
