"""Settings service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.settings import (
    FeaturePermission,
    GlobalIntegration,
    Module,
    PermissionAuditLog,
    ProjectIntegration,
    RolePermission,
    StandardsRepository,
)
from apps.api.models.user import Profile, UserPermissionOverride
from packages.common.utils.error_handlers import not_found


class SettingsService:
    """Settings and permissions management."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_modules(self) -> list[Module]:
        stmt = select(Module).order_by(Module.name)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_permissions_for_role(self, role: str) -> list[RolePermission]:
        stmt = select(RolePermission).where(RolePermission.role == role)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_permission(self, perm_id: UUID, data: dict) -> RolePermission:
        perm = await self.session.get(RolePermission, perm_id)
        if not perm:
            raise not_found("Permission")
        for key, value in data.items():
            if hasattr(perm, key):
                setattr(perm, key, value)
        await self.session.flush()
        await self.session.refresh(perm)
        return perm

    async def get_global_integrations(self) -> list[GlobalIntegration]:
        stmt = select(GlobalIntegration)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_global_integration(self, data) -> GlobalIntegration:
        integration = GlobalIntegration(**data.model_dump())
        self.session.add(integration)
        await self.session.flush()
        await self.session.refresh(integration)
        return integration

    async def get_project_integrations(self, product_id: UUID) -> list[ProjectIntegration]:
        stmt = select(ProjectIntegration).where(ProjectIntegration.product_id == product_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_project_integration(self, data) -> ProjectIntegration:
        integration = ProjectIntegration(**data.model_dump())
        self.session.add(integration)
        await self.session.flush()
        await self.session.refresh(integration)
        return integration

    async def update_global_integration(
        self, integration_id: UUID, data: dict,
    ) -> GlobalIntegration:
        integration = await self.session.get(GlobalIntegration, integration_id)
        if not integration:
            raise not_found("Integration")
        for key, value in data.items():
            if hasattr(integration, key):
                setattr(integration, key, value)
        await self.session.flush()
        await self.session.refresh(integration)
        return integration

    async def delete_global_integration(self, integration_id: UUID) -> None:
        integration = await self.session.get(GlobalIntegration, integration_id)
        if not integration:
            raise not_found("Integration")
        await self.session.delete(integration)
        await self.session.flush()

    async def get_all_permissions(self) -> list[RolePermission]:
        stmt = select(RolePermission)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_feature_permissions(self) -> list[FeaturePermission]:
        stmt = select(FeaturePermission).order_by(FeaturePermission.sort_order)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_user_overrides(
        self, user_id: UUID | None = None,
    ) -> list[UserPermissionOverride]:
        stmt = select(UserPermissionOverride)
        if user_id:
            stmt = stmt.where(UserPermissionOverride.user_id == str(user_id))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_user_override(self, data) -> UserPermissionOverride:
        override = UserPermissionOverride(**data.model_dump())
        self.session.add(override)
        await self.session.flush()
        await self.session.refresh(override)
        return override

    async def update_user_override(
        self, override_id: UUID, data: dict,
    ) -> UserPermissionOverride:
        override = await self.session.get(UserPermissionOverride, override_id)
        if not override:
            raise not_found("User override")
        for key, value in data.items():
            if hasattr(override, key):
                setattr(override, key, value)
        await self.session.flush()
        await self.session.refresh(override)
        return override

    async def delete_user_override(self, override_id: UUID) -> None:
        override = await self.session.get(UserPermissionOverride, override_id)
        if not override:
            raise not_found("User override")
        await self.session.delete(override)
        await self.session.flush()

    async def get_permission_audit_log(
        self, limit: int = 50,
    ) -> list[PermissionAuditLog]:
        stmt = (
            select(PermissionAuditLog)
            .order_by(PermissionAuditLog.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_standards_repositories(self) -> list[StandardsRepository]:
        stmt = select(StandardsRepository).order_by(StandardsRepository.name)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_standards_repository(
        self, data, created_by: UUID,
    ) -> StandardsRepository:
        repo = StandardsRepository(**data.model_dump(), created_by=created_by)
        self.session.add(repo)
        await self.session.flush()
        await self.session.refresh(repo)
        return repo

    async def update_standards_repository(
        self, repo_id: UUID, data: dict,
    ) -> StandardsRepository:
        repo = await self.session.get(StandardsRepository, repo_id)
        if not repo:
            raise not_found("Standards repository")
        for key, value in data.items():
            if hasattr(repo, key):
                setattr(repo, key, value)
        await self.session.flush()
        await self.session.refresh(repo)
        return repo

    async def delete_standards_repository(self, repo_id: UUID) -> None:
        repo = await self.session.get(StandardsRepository, repo_id)
        if not repo:
            raise not_found("Standards repository")
        await self.session.delete(repo)
        await self.session.flush()

    async def get_users(self) -> list[Profile]:
        stmt = select(Profile).order_by(Profile.full_name)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def invite_user(self, data) -> dict:
        return {"temp_password": "temporary_password_placeholder"}

    async def update_user_status(self, user_id: UUID, status: str) -> dict:
        profile = await self.session.get(Profile, user_id)
        if not profile:
            raise not_found("User")
        if hasattr(profile, "status"):
            profile.status = status
        await self.session.flush()
        await self.session.refresh(profile)
        return {"message": "Status updated"}

    async def reset_user_password(self, user_id: UUID) -> dict:
        profile = await self.session.get(Profile, user_id)
        if not profile:
            raise not_found("User")
        return {"temp_password": "temporary_password_placeholder"}
