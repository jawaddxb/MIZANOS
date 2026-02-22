"""Specification schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class SpecificationBase(BaseSchema):
    """Shared specification fields."""

    content: dict | None = None
    version: int = 1
    custom_instructions: str | None = None


class SpecificationCreate(SpecificationBase):
    """Specification creation schema."""

    product_id: UUID


class SpecificationUpdate(BaseSchema):
    """Specification update schema."""

    content: dict | None = None


class SpecificationResponse(SpecificationBase):
    """Specification response."""

    id: UUID
    product_id: UUID
    created_by: UUID | None = None
    created_at: datetime
    updated_at: datetime


class SpecFeatureBase(BaseSchema):
    """Specification feature fields."""

    name: str
    description: str | None = None
    status: str = "proposed"
    priority: str = "medium"
    acceptance_criteria: list[str] | str | None = None
    is_reusable: bool = False
    reusable_category: str | None = None
    github_path: str | None = None
    sort_order: int = 0


class SpecFeatureCreate(SpecFeatureBase):
    """Feature creation schema."""

    specification_id: UUID
    product_id: UUID


class SpecFeatureUpdate(BaseSchema):
    """Feature update schema."""

    name: str | None = None
    description: str | None = None
    priority: str | None = None
    status: str | None = None
    acceptance_criteria: list[str] | str | None = None
    github_path: str | None = None
    sort_order: int | None = None


class SpecFeatureResponse(SpecFeatureBase):
    """Feature response."""

    id: UUID
    specification_id: UUID | None = None
    product_id: UUID
    task_id: UUID | None = None
    source_feature_id: UUID | None = None
    source_product_id: UUID | None = None
    created_at: datetime


class MarkReusableRequest(BaseSchema):
    """Mark a feature as reusable."""

    reusable_category: str


class ImportFeatureRequest(BaseSchema):
    """Import a reusable feature to a target product."""

    target_product_id: UUID
    target_specification_id: UUID | None = None


class LibraryFeatureResponse(SpecFeatureResponse):
    """Reusable library feature with product context."""

    product_name: str
    import_count: int
