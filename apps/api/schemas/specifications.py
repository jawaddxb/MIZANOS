"""Specification schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class SpecificationBase(BaseSchema):
    """Shared specification fields."""

    overview: str | None = None
    goals: str | None = None
    user_stories: str | None = None
    technical_requirements: str | None = None
    design_notes: str | None = None
    version: int = 1


class SpecificationCreate(SpecificationBase):
    """Specification creation schema."""

    product_id: UUID


class SpecificationUpdate(BaseSchema):
    """Specification update schema."""

    overview: str | None = None
    goals: str | None = None
    user_stories: str | None = None
    technical_requirements: str | None = None
    design_notes: str | None = None


class SpecificationResponse(SpecificationBase):
    """Specification response."""

    id: UUID
    product_id: UUID
    created_at: datetime
    updated_at: datetime


class SpecFeatureBase(BaseSchema):
    """Specification feature fields."""

    name: str
    description: str | None = None
    priority: str = "medium"
    acceptance_criteria: str | None = None
    is_reusable: bool = False
    reusable_category: str | None = None
    github_path: str | None = None
    sort_order: int = 0


class SpecFeatureCreate(SpecFeatureBase):
    """Feature creation schema."""

    specification_id: UUID
    product_id: UUID


class SpecFeatureResponse(SpecFeatureBase):
    """Feature response."""

    id: UUID
    specification_id: UUID
    product_id: UUID
    created_at: datetime
