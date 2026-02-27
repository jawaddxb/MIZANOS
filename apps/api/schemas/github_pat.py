"""GitHub PAT schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import Field

from apps.api.schemas.base import BaseSchema


class GitHubPatCreate(BaseSchema):
    """Create a new GitHub PAT."""

    label: str = Field(..., min_length=1, max_length=100)
    token: str = Field(..., min_length=1)


class GitHubPatUpdate(BaseSchema):
    """Update a GitHub PAT."""

    label: str | None = None
    is_active: bool | None = None


class GitHubPatVerifyRequest(BaseSchema):
    """Verify a raw GitHub token."""

    token: str


class GitHubPatVerifyResponse(BaseSchema):
    """Result of verifying a GitHub token."""

    valid: bool
    github_username: str | None = None
    github_avatar_url: str | None = None
    github_user_id: int | None = None
    scopes: str | None = None


class GitHubPatResponse(BaseSchema):
    """GitHub PAT response (token never exposed)."""

    id: UUID
    label: str
    github_username: str
    github_avatar_url: str | None = None
    github_user_id: int
    created_by: UUID
    scopes: str | None = None
    last_used_at: datetime | None = None
    is_active: bool
    token_status: str = "valid"
    linked_products_count: int = 0
    created_at: datetime
    updated_at: datetime
