"""Product member service — add/remove members, validate team composition."""

import logging
from collections import Counter
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.models.enums import (
    REQUIRED_TEAM_COMPOSITION,
    NotificationType,
    ProductMemberRole,
)
from apps.api.models.notification import Notification
from apps.api.models.product import Product, ProductMember
from apps.api.models.settings import OrgSetting
from apps.api.models.user import Profile, UserRole
from apps.api.services.email_service import EmailService
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

logger = logging.getLogger(__name__)

MEMBER_ROLE_LABELS = {
    ProductMemberRole.PM: "Project Manager",
    ProductMemberRole.MARKETING: "Marketing",
    ProductMemberRole.BUSINESS_OWNER: "Business Owner",
    ProductMemberRole.AI_ENGINEER: "AI Engineer",
}


class ProductMemberService:
    """Handles product team member operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_members(self, product_id: UUID) -> list[ProductMember]:
        stmt = (
            select(ProductMember)
            .options(selectinload(ProductMember.profile))
            .where(ProductMember.product_id == product_id)
            .order_by(ProductMember.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_all_members(self) -> list[ProductMember]:
        """Return all product members across all products."""
        stmt = (
            select(ProductMember)
            .options(selectinload(ProductMember.profile))
            .order_by(ProductMember.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_member(
        self,
        product_id: UUID,
        profile_id: UUID,
        role: str,
        actor: dict,
    ) -> ProductMember:
        """Add a member to a product. Only admin/superadmin/PM can do this."""
        await self._check_manage_permission(actor)
        product = await self._get_product(product_id)
        profile = await self._get_profile(profile_id)
        await self._validate_pending_profile(profile)

        # Validate role value
        try:
            ProductMemberRole(role)
        except ValueError:
            valid = [r.value for r in ProductMemberRole]
            raise bad_request(f"Invalid role '{role}'. Must be one of: {valid}")

        member = ProductMember(
            product_id=product_id,
            profile_id=profile_id,
            role=role,
        )
        self.session.add(member)
        await self.session.flush()
        await self.session.refresh(member, attribute_names=["id", "created_at"])

        # Reload with profile relationship
        stmt = (
            select(ProductMember)
            .options(selectinload(ProductMember.profile))
            .where(ProductMember.id == member.id)
        )
        result = await self.session.execute(stmt)
        member = result.scalar_one()

        await self._notify_assignment(profile, product, role)

        return member

    async def remove_member(
        self, product_id: UUID, member_id: UUID, actor: dict
    ) -> None:
        """Remove a member from a product."""
        await self._check_manage_permission(actor)

        stmt = select(ProductMember).where(
            ProductMember.id == member_id,
            ProductMember.product_id == product_id,
        )
        result = await self.session.execute(stmt)
        member = result.scalar_one_or_none()
        if not member:
            raise not_found("ProductMember")

        await self.session.delete(member)
        await self.session.flush()

    async def validate_team_composition(self, product_id: UUID) -> dict:
        members = await self.get_members(product_id)
        role_counts = Counter(m.role for m in members)

        missing: list[str] = []
        for role_enum, min_count in REQUIRED_TEAM_COMPOSITION.items():
            if role_counts.get(role_enum.value, 0) < min_count:
                missing.append(MEMBER_ROLE_LABELS[role_enum])

        return {
            "complete": len(missing) == 0,
            "members": members,
            "missing": missing,
        }

    async def check_activation_readiness(self, product_id: UUID) -> None:
        """Raises 400 if team is incomplete for activation."""
        readiness = await self.validate_team_composition(product_id)
        if not readiness["complete"]:
            labels = ", ".join(readiness["missing"])
            raise bad_request(
                f"Cannot activate: missing team members ({labels})"
            )

    # ---- private helpers ----

    async def _validate_pending_profile(self, profile: Profile) -> None:
        """Reject adding pending profiles when org setting is off."""
        if profile.status != "pending":
            return
        stmt = select(OrgSetting.value).where(
            OrgSetting.key == "show_pending_profiles_in_assignments"
        )
        result = await self.session.execute(stmt)
        setting_value = result.scalar_one_or_none()
        if not setting_value or not setting_value.get("enabled"):
            raise bad_request(
                "Cannot add pending activation users to project teams"
            )

    async def _check_manage_permission(self, actor) -> None:
        user_id = actor.id if hasattr(actor, "id") else actor["id"]
        roles: set[str] = set()

        # Check profile's primary role
        profile_stmt = select(Profile.role).where(Profile.user_id == user_id)
        profile_result = await self.session.execute(profile_stmt)
        primary_role = profile_result.scalar_one_or_none()
        if primary_role:
            roles.add(primary_role)

        # Check additional roles from user_roles table
        stmt = select(UserRole.role).where(UserRole.user_id == user_id)
        result = await self.session.execute(stmt)
        roles.update(result.scalars().all())

        allowed = {"business_owner", "superadmin", "admin", "pm"}
        if not roles & allowed:
            raise forbidden("Only admins or PMs can manage product members")

    async def _get_product(self, product_id: UUID) -> Product:
        product = await self.session.get(Product, product_id)
        if not product:
            raise not_found("Product")
        return product

    async def _get_profile(self, profile_id: UUID) -> Profile:
        profile = await self.session.get(Profile, profile_id)
        if not profile:
            raise not_found("Profile")
        return profile

    async def _notify_assignment(
        self, profile: Profile, product: Product, role: str
    ) -> None:
        role_label = MEMBER_ROLE_LABELS.get(
            ProductMemberRole(role), role
        )
        title = f"You've been assigned to {product.name} as {role_label}"

        notification = Notification(
            user_id=profile.user_id,
            title=title,
            type=NotificationType.PRODUCT_MEMBER_ASSIGNED.value,
            product_id=product.id,
        )
        self.session.add(notification)

        if profile.email:
            product_url = f"/products/{product.id}"
            try:
                await EmailService.send_assignment_email(
                    to_email=profile.email,
                    full_name=profile.full_name or "Team Member",
                    product_name=product.name,
                    role=role_label,
                    product_url=product_url,
                )
            except Exception:
                logger.exception("Failed to send assignment email")
