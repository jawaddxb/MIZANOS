"""Settings service."""

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.models.settings import (
    FeaturePermission,
    Module,
    OrgSetting,
    PermissionAuditLog,
    RolePermission,
)
from apps.api.models.user import (
    InvitationToken,
    Profile,
    UserPermissionOverride,
    UserRole,
)
from apps.api.dependencies import AuthenticatedUser
from apps.api.services.invite_service import validate_invite_permission
from packages.common.utils.error_handlers import bad_request, forbidden, not_found


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

    async def update_permission(
        self, perm_id: UUID, data: dict, user: AuthenticatedUser | None = None,
    ) -> RolePermission:
        perm = await self.session.get(RolePermission, perm_id)
        if not perm:
            raise not_found("Permission")
        old_access = perm.can_access
        for key, value in data.items():
            if hasattr(perm, key):
                setattr(perm, key, value)
        await self.session.flush()
        await self.session.refresh(perm)
        if user:
            await self._log_audit(
                "role_permission_updated", perm.feature_key,
                target_role=perm.role,
                old_value={"can_access": old_access},
                new_value={"can_access": perm.can_access},
                changed_by=user.profile_id,
            )
        return perm

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

    async def create_user_override(
        self, data, user: AuthenticatedUser | None = None,
    ) -> UserPermissionOverride:
        override = UserPermissionOverride(**data.model_dump())
        self.session.add(override)
        await self.session.flush()
        await self.session.refresh(override)
        if user:
            await self._log_audit(
                "user_override_created", override.feature_key,
                target_user_id=override.user_id,
                new_value={"override_type": override.override_type},
                changed_by=user.profile_id,
            )
        return override

    async def update_user_override(
        self, override_id: UUID, data: dict, user: AuthenticatedUser | None = None,
    ) -> UserPermissionOverride:
        override = await self.session.get(UserPermissionOverride, override_id)
        if not override:
            raise not_found("User override")
        old_type = override.override_type
        for key, value in data.items():
            if hasattr(override, key):
                setattr(override, key, value)
        await self.session.flush()
        await self.session.refresh(override)
        if user:
            await self._log_audit(
                "user_override_updated", override.feature_key,
                target_user_id=override.user_id,
                old_value={"override_type": old_type},
                new_value={"override_type": override.override_type},
                changed_by=user.profile_id,
            )
        return override

    async def delete_user_override(
        self, override_id: UUID, user: AuthenticatedUser | None = None,
    ) -> None:
        override = await self.session.get(UserPermissionOverride, override_id)
        if not override:
            raise not_found("User override")
        feature_key = override.feature_key
        user_id = override.user_id
        override_type = override.override_type
        await self.session.delete(override)
        await self.session.flush()
        if user:
            await self._log_audit(
                "user_override_deleted", feature_key,
                target_user_id=user_id,
                old_value={"override_type": override_type},
                changed_by=user.profile_id,
            )

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

    async def get_users(self) -> list[Profile]:
        stmt = select(Profile).order_by(Profile.full_name)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def invite_user(self, data, user: AuthenticatedUser | None = None) -> dict:
        from apps.api.services.email_service import EmailService

        if user:
            inviter_roles = [user.role] if user.role else []
            inviter_roles.extend(user.additional_roles)
            validate_invite_permission(inviter_roles, data.role)

        existing = await self.session.execute(
            select(Profile).where(func.lower(Profile.email) == data.email.lower())
        )
        if existing.scalar_one_or_none():
            raise bad_request("A user with this email already exists")

        profile = Profile(
            user_id=str(uuid.uuid4()),
            email=data.email,
            full_name=data.full_name,
            role=data.role,
            title=getattr(data, "title", None),
            office_location=getattr(data, "office_location", None),
            status="pending",
            invited_at=datetime.now(timezone.utc),
            must_reset_password=True,
            skills=getattr(data, "skills", None),
            max_projects=getattr(data, "max_projects", None),
            reports_to=getattr(data, "reports_to", None),
        )
        self.session.add(profile)
        await self.session.flush()
        await self.session.refresh(profile)

        user_role = UserRole(user_id=profile.user_id, role=data.role)
        self.session.add(user_role)
        await self.session.flush()

        token_value = secrets.token_urlsafe(48)
        invitation = InvitationToken(
            profile_id=profile.id,
            token=token_value,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        self.session.add(invitation)
        await self.session.flush()

        link = f"{settings.app_base_url}/activate?token={token_value}"

        email_setting_stmt = select(OrgSetting.value).where(
            OrgSetting.key == "send_activation_email_on_invite"
        )
        email_setting = (await self.session.execute(email_setting_stmt)).scalar_one_or_none()
        should_send_email = not email_setting or email_setting.get("enabled", True)

        if should_send_email:
            await EmailService.send_invitation_email(
                to_email=data.email,
                full_name=data.full_name,
                activation_link=link,
                inviter_name="Mizan Admin",
            )
            return {"message": "Invitation sent", "user_id": str(profile.id)}

        return {
            "message": "User created (activation email disabled)",
            "user_id": str(profile.id),
        }

    async def update_user_status(
        self, user_id: UUID, status: str, acting_user_id: str,
    ) -> dict:
        acting_profile = await self._get_profile_by_user_id(acting_user_id)
        if not acting_profile:
            raise forbidden("Could not verify your account")

        actor_role = acting_profile.role or ""
        if actor_role not in ("superadmin", "admin"):
            raise forbidden("Only admins can change user status")

        target = await self.session.get(Profile, user_id)
        if not target:
            raise not_found("User")

        target_role = target.role or ""
        if actor_role == "admin" and target_role in ("admin", "superadmin"):
            raise forbidden("Admins cannot change the status of other admins or superadmins")

        target.status = status
        await self.session.flush()
        await self.session.refresh(target)
        return {"message": "Status updated"}

    async def _log_audit(
        self,
        action_type: str,
        feature_key: str,
        target_role: str | None = None,
        target_user_id: str | None = None,
        old_value: dict | None = None,
        new_value: dict | None = None,
        changed_by: UUID | None = None,
    ) -> None:
        entry = PermissionAuditLog(
            action_type=action_type,
            feature_key=feature_key,
            target_role=target_role,
            target_user_id=target_user_id,
            old_value=old_value,
            new_value=new_value,
            changed_by=changed_by,
        )
        self.session.add(entry)
        await self.session.flush()

    async def _get_profile_by_user_id(self, user_id: str) -> Profile | None:
        stmt = select(Profile).where(Profile.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def reset_user_password(self, user_id: UUID) -> dict:
        from apps.api.services.auth_service import pwd_context

        profile = await self.session.get(Profile, user_id)
        if not profile:
            raise not_found("User")

        temp_password = secrets.token_urlsafe(12)
        profile.password_hash = pwd_context.hash(temp_password)
        profile.must_reset_password = True
        await self.session.flush()
        await self.session.refresh(profile)

        return {"temp_password": temp_password}

