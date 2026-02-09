"""Team schemas."""

from datetime import date, datetime
from uuid import UUID

from pydantic import field_validator

from apps.api.schemas.base import BaseSchema


class ProfileResponse(BaseSchema):
    """User profile response."""

    id: UUID
    user_id: UUID
    full_name: str | None = None
    avatar_url: str | None = None
    role: str = "engineer"
    status: str = "active"
    skills: list[str] = []
    availability_status: str | None = None
    max_concurrent_projects: int = 3
    last_login: datetime | None = None
    created_at: datetime

    @field_validator("skills", mode="before")
    @classmethod
    def coerce_none_skills(cls, v: list[str] | None) -> list[str]:
        return v if v is not None else []


class ProfileUpdate(BaseSchema):
    """Profile update."""

    full_name: str | None = None
    avatar_url: str | None = None
    skills: list[str] | None = None
    availability_status: str | None = None
    max_concurrent_projects: int | None = None


class HolidayCreate(BaseSchema):
    """Team holiday creation."""

    user_id: UUID
    start_date: date
    end_date: date
    reason: str | None = None


class HolidayResponse(BaseSchema):
    """Team holiday response."""

    id: UUID
    user_id: UUID
    start_date: date
    end_date: date
    reason: str | None = None
    created_at: datetime
