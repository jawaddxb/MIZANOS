"""Settings schemas."""

from datetime import datetime
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class ModuleResponse(BaseSchema):
    """Module response."""

    id: UUID
    name: str
    description: str | None = None
    documentation_url: str | None = None
    scaffolding_command: str | None = None
    category: str | None = None
    created_at: datetime


class RolePermissionResponse(BaseSchema):
    """Role permission response."""

    id: UUID
    role: str
    feature_id: UUID
    can_create: bool = False
    can_read: bool = True
    can_update: bool = False
    can_delete: bool = False


class RolePermissionUpdate(BaseSchema):
    """Role permission update."""

    can_create: bool | None = None
    can_read: bool | None = None
    can_update: bool | None = None
    can_delete: bool | None = None


class IntegrationBase(BaseSchema):
    """Integration fields."""

    name: str
    type: str
    config: dict = {}
    is_enabled: bool = True


class GlobalIntegrationCreate(IntegrationBase):
    """Global integration creation."""

    pass


class ProjectIntegrationCreate(IntegrationBase):
    """Project integration creation."""

    product_id: UUID


class IntegrationResponse(IntegrationBase):
    """Integration response."""

    id: UUID
    created_at: datetime
    updated_at: datetime


class FeaturePermissionResponse(BaseSchema):
    """Feature permission response."""

    id: UUID
    feature_key: str
    feature_name: str
    category: str | None = None
    description: str | None = None
    sort_order: int = 0


class UserOverrideCreate(BaseSchema):
    """User override creation."""

    user_id: str
    feature_key: str
    override_type: str
    reason: str | None = None
    expires_at: datetime | None = None


class UserOverrideResponse(BaseSchema):
    """User override response."""

    id: UUID
    user_id: str
    feature_key: str
    override_type: str
    reason: str | None = None
    expires_at: datetime | None = None
    created_at: datetime


class UserOverrideUpdate(BaseSchema):
    """User override update."""

    override_type: str | None = None
    reason: str | None = None
    expires_at: datetime | None = None


class PermissionAuditLogResponse(BaseSchema):
    """Permission audit log response."""

    id: UUID
    action_type: str
    feature_key: str
    target_role: str | None = None
    target_user_id: str | None = None
    old_value: dict | None = None
    new_value: dict | None = None
    changed_by: UUID | None = None
    created_at: datetime


class StandardsRepositoryCreate(BaseSchema):
    """Standards repository creation."""

    name: str
    url: str
    description: str | None = None
    markdown_content: str | None = None


class StandardsRepositoryResponse(BaseSchema):
    """Standards repository response."""

    id: UUID
    name: str
    url: str
    description: str | None = None
    markdown_content: str | None = None
    is_active: bool = True
    created_at: datetime


class StandardsRepositoryUpdate(BaseSchema):
    """Standards repository update."""

    name: str | None = None
    url: str | None = None
    description: str | None = None
    markdown_content: str | None = None
    is_active: bool | None = None


class UserResponse(BaseSchema):
    """User response."""

    id: UUID
    email: str | None = None
    full_name: str | None = None
    role: str | None = None
    status: str | None = None
    avatar_url: str | None = None
    office_location: str | None = None


class InviteUserRequest(BaseSchema):
    """Invite user request."""

    email: str
    full_name: str
    role: str
    title: str | None = None
    skills: list[str] | None = None
    availability: str | None = None
    max_projects: int | None = None
    office_location: str | None = None
    reports_to: UUID | None = None


class UserStatusUpdate(BaseSchema):
    """User status update."""

    status: str


class RoleAssignRequest(BaseSchema):
    """Role assignment request."""

    role: str


class UserRoleResponse(BaseSchema):
    """User role response."""

    id: UUID
    user_id: str
    role: str
    assigned_by: UUID | None = None
    created_at: datetime


class OrgSettingResponse(BaseSchema):
    """Org-level setting response."""

    id: UUID
    key: str
    value: dict
    updated_by: UUID | None = None
    updated_at: datetime


class OrgSettingUpdate(BaseSchema):
    """Org-level setting update."""

    value: dict
