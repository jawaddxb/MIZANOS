"""Port generator request/response schemas."""

from apps.api.schemas.base import BaseSchema


class ExtractRequest(BaseSchema):
    """Request to extract manifest from a Lovable project."""

    source_path: str


class GenerateRequest(BaseSchema):
    """Request to generate porting tasks for a product."""

    source_path: str | None = None


class GenerateResponse(BaseSchema):
    """Response from port task generation."""

    tasks_created: int
    domains: list[str]
    summary: dict
