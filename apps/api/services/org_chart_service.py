"""Org chart service: hierarchy management and invite resend."""

import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.models.user import InvitationToken, Profile, UserRole
from apps.api.services.email_service import EmailService
from packages.common.utils.error_handlers import bad_request, forbidden, not_found


class OrgChartService:
    """Manages the organisational hierarchy and invitation resend."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_org_tree(self) -> list[dict]:
        """Return a flat list of all profiles with roles for the org chart."""
        profiles_result = await self.session.execute(
            select(Profile).order_by(Profile.full_name)
        )
        profiles = list(profiles_result.scalars().all())

        roles_result = await self.session.execute(
            select(UserRole.user_id, UserRole.role)
        )
        roles_by_user: dict[str, list[str]] = {}
        for user_id, role in roles_result.all():
            roles_by_user.setdefault(user_id, []).append(role)

        return [
            {
                "id": p.id,
                "full_name": p.full_name,
                "email": p.email,
                "title": p.title,
                "roles": roles_by_user.get(p.user_id, []),
                "avatar_url": p.avatar_url,
                "office_location": p.office_location,
                "status": p.status,
                "reports_to": p.reports_to,
            }
            for p in profiles
        ]

    async def update_reporting_line(
        self, profile_id: UUID, manager_id: UUID | None,
    ) -> dict:
        """Set or clear a profile's manager. Prevents self-ref and cycles."""
        profile = await self.session.get(Profile, profile_id)
        if not profile:
            raise not_found("Profile")

        if manager_id is not None:
            if manager_id == profile_id:
                raise bad_request("A user cannot report to themselves")
            manager = await self.session.get(Profile, manager_id)
            if not manager:
                raise not_found("Manager profile")
            await self._check_circular(profile_id, manager_id)

        profile.reports_to = manager_id
        await self.session.flush()
        await self.session.refresh(profile)
        return {"message": "Reporting line updated"}

    async def resend_invite(self, profile_id: UUID, inviter_name: str) -> dict:
        """Create a new invitation token and send the activation email."""
        profile = await self.session.get(Profile, profile_id)
        if not profile:
            raise not_found("Profile")
        if profile.status != "pending":
            raise bad_request("Only pending users can receive invitations")

        token_value = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        inv_token = InvitationToken(
            profile_id=profile_id,
            token=token_value,
            expires_at=expires_at,
        )
        self.session.add(inv_token)
        await self.session.flush()

        activation_link = f"{settings.app_base_url}/activate?token={token_value}"
        await EmailService.send_invitation_email(
            to_email=profile.email or "",
            full_name=profile.full_name or "Team Member",
            activation_link=activation_link,
            inviter_name=inviter_name,
        )
        return {"message": "Invitation resent"}

    async def _check_circular(self, profile_id: UUID, new_manager_id: UUID) -> None:
        """Walk up the chain from new_manager_id to ensure profile_id isn't an ancestor."""
        visited: set[UUID] = set()
        current_id: UUID | None = new_manager_id
        while current_id is not None:
            if current_id in visited:
                break
            visited.add(current_id)
            if current_id == profile_id:
                raise bad_request("This change would create a circular reporting chain")
            mgr = await self.session.get(Profile, current_id)
            current_id = mgr.reports_to if mgr else None
