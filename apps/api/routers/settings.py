"""Settings router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import AuthenticatedUser, CurrentUser, DbSession
from apps.api.auth import require_admin, require_roles, require_super_admin
from apps.api.models.enums import AppRole
from apps.api.schemas.settings import (
    FeaturePermissionResponse,
    GlobalIntegrationCreate,
    IntegrationResponse,
    InviteUserRequest,
    ModuleResponse,
    OrgSettingResponse,
    OrgSettingUpdate,
    PermissionAuditLogResponse,
    ProjectIntegrationCreate,
    RoleAssignRequest,
    RolePermissionResponse,
    RolePermissionUpdate,
    StandardsRepositoryCreate,
    StandardsRepositoryResponse,
    StandardsRepositoryUpdate,
    UserOverrideCreate,
    UserOverrideResponse,
    UserOverrideUpdate,
    UserResponse,
    UserRoleResponse,
    UserStatusUpdate,
)
from apps.api.services.global_integration_service import GlobalIntegrationService
from apps.api.services.org_settings_service import OrgSettingsService
from apps.api.services.role_service import RoleService
from apps.api.services.settings_service import SettingsService
from apps.api.services.standards_service import StandardsService

router = APIRouter()


def get_service(db: DbSession) -> SettingsService:
    return SettingsService(db)


def get_role_service(db: DbSession) -> RoleService:
    return RoleService(db)


def get_integration_service(db: DbSession) -> GlobalIntegrationService:
    return GlobalIntegrationService(db)


def get_standards_service(db: DbSession) -> StandardsService:
    return StandardsService(db)


def get_org_settings_service(db: DbSession) -> OrgSettingsService:
    return OrgSettingsService(db)


@router.get("/modules", response_model=list[ModuleResponse])
async def list_modules(user: CurrentUser, service: SettingsService = Depends(get_service)):
    return await service.get_modules()


@router.get("/permissions/{role}", response_model=list[RolePermissionResponse])
async def get_role_permissions(role: str, user: CurrentUser, service: SettingsService = Depends(get_service)):
    return await service.get_permissions_for_role(role)


@router.patch("/permissions/{permission_id}", response_model=RolePermissionResponse)
async def update_permission(permission_id: UUID, body: RolePermissionUpdate, user: AuthenticatedUser = require_admin(), service: SettingsService = Depends(get_service)):
    return await service.update_permission(permission_id, body.model_dump(exclude_unset=True), user)


@router.get("/integrations/global", response_model=list[IntegrationResponse])
async def list_global_integrations(user: CurrentUser, service: GlobalIntegrationService = Depends(get_integration_service)):
    return await service.get_global()


@router.post("/integrations/global", response_model=IntegrationResponse, status_code=201)
async def create_global_integration(body: GlobalIntegrationCreate, user: CurrentUser, service: GlobalIntegrationService = Depends(get_integration_service)):
    return await service.create_global(body)


@router.get("/integrations/project/{product_id}", response_model=list[IntegrationResponse])
async def list_project_integrations(product_id: UUID, user: CurrentUser, service: GlobalIntegrationService = Depends(get_integration_service)):
    return await service.get_project(product_id)


@router.post("/integrations/project", response_model=IntegrationResponse, status_code=201)
async def create_project_integration(body: ProjectIntegrationCreate, user: CurrentUser, service: GlobalIntegrationService = Depends(get_integration_service)):
    return await service.create_project(body)


@router.get("/integrations", response_model=list[IntegrationResponse])
async def list_integrations_alias(user: CurrentUser, service: GlobalIntegrationService = Depends(get_integration_service)):
    """Alias for /integrations/global for backward compatibility."""
    return await service.get_global()


@router.patch("/integrations/global/{integration_id}", response_model=IntegrationResponse)
async def update_global_integration(integration_id: UUID, body: dict, user: CurrentUser, service: GlobalIntegrationService = Depends(get_integration_service)):
    return await service.update_global(integration_id, body)


@router.delete("/integrations/global/{integration_id}", status_code=204)
async def delete_global_integration(integration_id: UUID, user: CurrentUser, service: GlobalIntegrationService = Depends(get_integration_service)):
    await service.delete_global(integration_id)


@router.get("/permissions", response_model=list[RolePermissionResponse])
async def list_all_permissions(user: CurrentUser, service: SettingsService = Depends(get_service)):
    return await service.get_all_permissions()


@router.get("/feature-permissions", response_model=list[FeaturePermissionResponse])
async def list_feature_permissions(user: CurrentUser, service: SettingsService = Depends(get_service)):
    return await service.get_feature_permissions()


@router.get("/user-overrides", response_model=list[UserOverrideResponse])
async def list_user_overrides(user_id: UUID | None = None, user: CurrentUser, service: SettingsService = Depends(get_service)):
    return await service.get_user_overrides(user_id)


@router.post("/user-overrides", response_model=UserOverrideResponse, status_code=201)
async def create_user_override(body: UserOverrideCreate, user: AuthenticatedUser = require_admin(), service: SettingsService = Depends(get_service)):
    return await service.create_user_override(body, user)


@router.patch("/user-overrides/{override_id}", response_model=UserOverrideResponse)
async def update_user_override(override_id: UUID, body: UserOverrideUpdate, user: AuthenticatedUser = require_admin(), service: SettingsService = Depends(get_service)):
    return await service.update_user_override(override_id, body.model_dump(exclude_unset=True), user)


@router.delete("/user-overrides/{override_id}", status_code=204)
async def delete_user_override(override_id: UUID, user: AuthenticatedUser = require_admin(), service: SettingsService = Depends(get_service)):
    await service.delete_user_override(override_id, user)


@router.get("/permission-audit-log", response_model=list[PermissionAuditLogResponse])
async def list_permission_audit_log(limit: int = 50, user: CurrentUser, service: SettingsService = Depends(get_service)):
    return await service.get_permission_audit_log(limit)


@router.get("/standards-repositories", response_model=list[StandardsRepositoryResponse])
async def list_standards_repositories(user: CurrentUser, service: StandardsService = Depends(get_standards_service)):
    return await service.get_all()


@router.post("/standards-repositories", response_model=StandardsRepositoryResponse, status_code=201)
async def create_standards_repository(body: StandardsRepositoryCreate, user: CurrentUser, service: StandardsService = Depends(get_standards_service)):
    return await service.create(body, user.id)


@router.patch("/standards-repositories/{repo_id}", response_model=StandardsRepositoryResponse)
async def update_standards_repository(repo_id: UUID, body: StandardsRepositoryUpdate, user: CurrentUser, service: StandardsService = Depends(get_standards_service)):
    return await service.update(repo_id, body.model_dump(exclude_unset=True))


@router.delete("/standards-repositories/{repo_id}", status_code=204)
async def delete_standards_repository(repo_id: UUID, user: CurrentUser, service: StandardsService = Depends(get_standards_service)):
    await service.delete(repo_id)


@router.get("/users", response_model=list[UserResponse])
async def list_users(user: AuthenticatedUser = require_admin(), service: SettingsService = Depends(get_service)):
    return await service.get_users()


@router.post("/users/invite", status_code=201)
async def invite_user(body: InviteUserRequest, user: AuthenticatedUser = require_roles(AppRole.PM), service: SettingsService = Depends(get_service)):
    return await service.invite_user(body, user)


@router.patch("/users/{user_id}/status")
async def update_user_status(user_id: UUID, body: UserStatusUpdate, user: AuthenticatedUser = require_admin(), service: SettingsService = Depends(get_service)):
    return await service.update_user_status(user_id, body.status, user.id)


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(user_id: UUID, user: AuthenticatedUser = require_admin(), service: SettingsService = Depends(get_service)):
    return await service.reset_user_password(user_id)


@router.get("/user-roles", response_model=list[UserRoleResponse])
async def get_all_user_roles(user: CurrentUser, service: RoleService = Depends(get_role_service)):
    return await service.get_all_user_roles()


@router.get("/users/{user_id}/roles", response_model=list[UserRoleResponse])
async def get_user_roles(user_id: UUID, user: CurrentUser, service: RoleService = Depends(get_role_service)):
    return await service.get_user_roles(user_id)


@router.post("/users/{user_id}/roles", response_model=UserRoleResponse, status_code=201)
async def assign_role(user_id: UUID, body: RoleAssignRequest, user: CurrentUser, service: RoleService = Depends(get_role_service)):
    return await service.assign_role(user_id, body.role, user)


@router.delete("/users/{user_id}/roles/{role}", status_code=204)
async def remove_role(user_id: UUID, role: str, user: CurrentUser, service: RoleService = Depends(get_role_service)):
    await service.remove_role(user_id, role, user)


@router.patch("/users/{user_id}/primary-role")
async def update_primary_role(user_id: UUID, body: RoleAssignRequest, user: CurrentUser, service: RoleService = Depends(get_role_service)):
    return await service.update_primary_role(user_id, body.role, user)


@router.get("/org", response_model=list[OrgSettingResponse])
async def list_org_settings(
    user: CurrentUser,
    service: OrgSettingsService = Depends(get_org_settings_service),
):
    return await service.get_all()


@router.patch("/org/{key}", response_model=OrgSettingResponse)
async def update_org_setting(
    key: str,
    body: OrgSettingUpdate,
    user: AuthenticatedUser = require_super_admin(),
    service: OrgSettingsService = Depends(get_org_settings_service),
):
    return await service.update(key, body.value, user.profile_id)
