"""API key schemas."""

from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ApiKeyCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=100)


class ApiKeyUpdate(BaseModel):
    label: str | None = None
    is_active: bool | None = None


class ApiKeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    label: str
    key_prefix: str
    created_by: UUID
    is_active: bool
    last_used_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ApiKeyCreateResponse(ApiKeyResponse):
    raw_key: str
