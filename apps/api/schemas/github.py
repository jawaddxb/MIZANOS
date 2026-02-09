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


class GitHubOAuthCallback(BaseSchema):
    """GitHub OAuth callback data."""

    code: str
    state: str | None = None
