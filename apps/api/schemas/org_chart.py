"""Org chart schemas."""

from uuid import UUID

from pydantic import BaseModel


class OrgChartNodeResponse(BaseModel):
    """A single node in the org chart (flat list)."""

    id: UUID
    full_name: str | None = None
    email: str | None = None
    title: str | None = None
    roles: list[str] = []
    avatar_url: str | None = None
    office_location: str | None = None
    status: str | None = None
    reports_to: UUID | None = None


class UpdateReportingLineRequest(BaseModel):
    """Request body for changing a profile's manager."""

    manager_id: UUID | None = None
