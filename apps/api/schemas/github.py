"""GitHub integration schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class GitHubConnectionResponse(BaseSchema):
    """GitHub connection response."""

    id: UUID
    user_id: str
    github_username: str
    github_avatar_url: str | None = None
    connected_at: datetime


class RepoAnalysisRequest(BaseSchema):
    """Request to analyze a GitHub repository."""

    repository_url: str
    product_id: UUID


class RepoAnalysisResponse(BaseSchema):
    """Repository analysis result."""

    id: UUID
    product_id: UUID
    repository_url: str
    overall_score: float | None = None
    tech_stack: dict | None = None
    created_at: datetime


class RepoInfoRequest(BaseSchema):
    """Request to get repository info."""

    repository_url: str
    github_token: str | None = None
    pat_id: str | None = None


class RepoInfoResponse(BaseSchema):
    """Repository info response."""

    name: str | None = None
    full_name: str | None = None
    description: str | None = None
    language: str | None = None
    default_branch: str | None = None
    stars: int = 0
    forks: int = 0
    open_issues: int = 0


class RepoBranchesRequest(BaseSchema):
    """Request to list repository branches."""

    repository_url: str
    pat_id: str | None = None


class RepoBranchResponse(BaseSchema):
    """A single branch."""

    name: str
    is_default: bool = False


class RepoAccessCheckRequest(BaseSchema):
    """Request to check repo access for a product."""

    product_id: UUID


class RepoAccessCheckResponse(BaseSchema):
    """Repo access check result."""

    status: str
    error: str | None = None


class ScanRequest(BaseSchema):
    """Request to trigger a repo scan."""

    product_id: UUID


class ScanResponse(BaseSchema):
    """Scan result."""

    status: str
    files_changed: int | None = None


class RepoScanHistoryResponse(BaseSchema):
    """Repo scan history response."""

    id: UUID
    product_id: UUID
    repository_url: str
    branch: str
    scan_status: str
    files_changed: int
    created_at: datetime


class GitHubOAuthCallback(BaseSchema):
    """GitHub OAuth callback data."""

    code: str
    state: str | None = None
