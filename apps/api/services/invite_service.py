"""Invite permission matrix and validation helpers."""

from packages.common.utils.error_handlers import forbidden

INVITE_MATRIX: dict[str, set[str]] = {
    "business_owner": {"superadmin", "admin", "project_manager", "engineer", "business_development", "marketing", "operations"},
    "superadmin": {"admin", "project_manager", "engineer", "business_development", "marketing", "operations"},
    "admin": {"project_manager", "engineer", "business_development", "marketing", "operations"},
    "project_manager": {"engineer", "business_development", "marketing", "operations"},
    "engineer": set(),
    "business_development": set(),
    "marketing": set(),
    "operations": set(),
}


def get_invitable_roles(inviter_roles: list[str]) -> set[str]:
    """Return the set of roles the inviter can assign to new users."""
    allowed: set[str] = set()
    for role in inviter_roles:
        allowed |= INVITE_MATRIX.get(role, set())
    return allowed


def validate_invite_permission(inviter_roles: list[str], target_role: str) -> None:
    """Raise 403 if the inviter cannot invite users with the target role."""
    allowed = get_invitable_roles(inviter_roles)
    if target_role not in allowed:
        raise forbidden("You cannot invite users with this role")
