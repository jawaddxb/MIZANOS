"""Team schemas."""

from datetime import date as Date
from datetime import datetime
from typing import Optional
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
    start_date: Date
    end_date: Date
    reason: str | None = None


class HolidayResponse(BaseSchema):
    """Team holiday response."""

    id: UUID
    user_id: UUID
    start_date: Date
    end_date: Date
    reason: str | None = None
    created_at: datetime


class NationalHolidayResponse(BaseSchema):
    """National holiday response."""

    id: UUID
    name: str
    date: Date
    location: str
    recurring: bool | None = None
    created_at: datetime


class NationalHolidayCreate(BaseSchema):
    """National holiday creation."""

    name: str
    date: Date
    location: str
    recurring: bool | None = None


class NationalHolidayUpdate(BaseSchema):
    """National holiday update."""

    name: str | None = None
    date: Optional[Date] = None
    location: str | None = None
    recurring: bool | None = None


class AvailabilityResponse(BaseSchema):
    """Combined availability response."""

    profile_id: UUID
    personal_holidays: list[HolidayResponse] = []
    national_holidays: list[NationalHolidayResponse] = []
