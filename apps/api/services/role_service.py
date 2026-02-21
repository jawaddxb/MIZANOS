"""Role management service with authorization and audit logging."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.dependencies import AuthenticatedUser
from apps.api.models.enums import AppRole
from apps.api.models.settings import PermissionAuditLog
from apps.api.models.user import Profile, UserRole
from packages.common.utils.error_handlers import bad_request, forbidden, not_found


class RoleService:
    """Role assignment, removal, and primary role management."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _check_authorization(
        self,
        actor: AuthenticatedUser,
        target: Profile,
        role: str | None = None,
    ) -> None:
        """Check that actor can modify roles on the target."""
        actor_is_superadmin = actor.has_role(AppRole.SUPERADMIN)
        actor_is_business_owner = actor.has_role(AppRole.BUSINESS_OWNER)
        actor_is_admin = actor.has_role(AppRole.ADMIN)

        if not (actor_is_superadmin or actor_is_business_owner or actor_is_admin):
            raise forbidden("Only admins can manage roles")

        # Superadmin: unrestricted
        if actor_is_superadmin:
            return

        # Business owner: cannot modify or assign superadmin
        if actor_is_business_owner:
            if target.role == "superadmin":
                raise forbidden("Business owners cannot modify superadmin roles")
            if role == "superadmin":
                raise forbidden("Business owners cannot assign the superadmin role")
            return

        # Admin: cannot modify superadmin/business_owner, cannot self-modify
        if target.role in ("superadmin", "business_owner"):
            raise forbidden("Admins cannot modify superadmin or business owner roles")
        if role in ("superadmin", "business_owner"):
            raise forbidden("Admins cannot assign superadmin or business owner roles")
        if target.user_id == actor.id:
            raise forbidden("Admins cannot modify their own roles")

    async def _get_target(self, user_id: UUID) -> Profile:
        target = await self.session.get(Profile, user_id)
        if not target:
            raise not_found("User")
        return target

    async def assign_role(
        self, user_id: UUID, role: str, actor: AuthenticatedUser,
    ) -> UserRole:
        if role == "superadmin":
            raise bad_request("Superadmin cannot be assigned as a secondary role")
        target = await self._get_target(user_id)
        self._check_authorization(actor, target, role)

        if target.role == role:
            raise bad_request(f"'{role}' is already the user's primary role")

        user_role = UserRole(
            user_id=target.user_id,
            role=role,
            assigned_by=actor.profile_id,
        )
        self.session.add(user_role)

        audit = PermissionAuditLog(
            action_type="role_assigned",
            feature_key=role,
            target_user_id=target.user_id,
            new_value={"role": role},
            changed_by=actor.profile_id,
        )
        self.session.add(audit)
        await self.session.flush()
        await self.session.refresh(user_role)
        return user_role

    async def remove_role(
        self, user_id: UUID, role: str, actor: AuthenticatedUser,
    ) -> None:
        target = await self._get_target(user_id)
        self._check_authorization(actor, target, role)

        stmt = select(UserRole).where(
            UserRole.user_id == target.user_id,
            UserRole.role == role,
        )
        result = await self.session.execute(stmt)
        user_role = result.scalar_one_or_none()
        if not user_role:
            raise not_found("UserRole")

        audit = PermissionAuditLog(
            action_type="role_revoked",
            feature_key=role,
            target_user_id=target.user_id,
            old_value={"role": role},
            changed_by=actor.profile_id,
        )
        self.session.add(audit)
        await self.session.delete(user_role)
        await self.session.flush()

    async def get_user_roles(self, user_id: UUID) -> list[UserRole]:
        target = await self._get_target(user_id)
        stmt = select(UserRole).where(UserRole.user_id == target.user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_all_user_roles(self) -> list[UserRole]:
        """Return every user-role assignment (for bulk display)."""
        stmt = select(UserRole)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_primary_role(
        self, user_id: UUID, new_role: str, actor: AuthenticatedUser,
    ) -> Profile:
        target = await self._get_target(user_id)
        self._check_authorization(actor, target, new_role)

        old_role = target.role
        target.role = new_role

        conflict_stmt = select(UserRole).where(
            UserRole.user_id == target.user_id,
            UserRole.role == new_role,
        )
        conflict_result = await self.session.execute(conflict_stmt)
        conflicting = conflict_result.scalar_one_or_none()
        if conflicting:
            await self.session.delete(conflicting)

        audit = PermissionAuditLog(
            action_type="primary_role_changed",
            feature_key=new_role,
            target_user_id=target.user_id,
            old_value={"role": old_role},
            new_value={"role": new_role},
            changed_by=actor.profile_id,
        )
        self.session.add(audit)
        await self.session.flush()
        await self.session.refresh(target)
        return target
