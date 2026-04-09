"""Dependency injection for FastAPI routes."""

from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.models.enums import AppRole
from packages.common.db.session import async_session_factory

security = HTTPBearer(auto_error=False)

API_KEY_PREFIX = "mizan_key_"

# Paths allowed for API key auth (prefix match)
API_KEY_ALLOWED_PATHS = (
    "/tasks",
    "/products",
    "/task-attachments",
    "/health",
)


@dataclass
class AuthenticatedUser:
    """Represents the currently authenticated user with role info."""

    id: str
    email: str
    profile_id: UUID | None = None
    role: str | None = None
    additional_roles: list[str] = field(default_factory=list)
    is_api_key: bool = False

    def has_role(self, role: AppRole) -> bool:
        return self.role == role.value or role.value in self.additional_roles

    def has_any_role(self, *roles: AppRole) -> bool:
        return any(self.has_role(r) for r in roles)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session per request."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def _build_user_from_profile(db: AsyncSession, profile) -> AuthenticatedUser:
    """Build AuthenticatedUser from a Profile row."""
    from apps.api.models.user import UserRole

    roles_result = await db.execute(
        select(UserRole.role).where(UserRole.user_id == profile.user_id)
    )
    additional_roles = [r for (r,) in roles_result.all()]

    return AuthenticatedUser(
        id=profile.user_id,
        email=profile.email or "",
        profile_id=profile.id,
        role=profile.role,
        additional_roles=additional_roles,
    )


async def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthenticatedUser:
    """Extract and validate the current user from JWT token or API key."""
    from apps.api.models.user import Profile

    # Resolve token from Authorization header or X-API-Key header
    token: str | None = None
    if credentials:
        token = credentials.credentials
    if not token:
        token = request.headers.get("X-API-Key")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    # API key path
    if token.startswith(API_KEY_PREFIX):
        from apps.api.services.api_key_service import ApiKeyService

        svc = ApiKeyService(db)
        api_key = await svc.authenticate_by_key(token)
        if not api_key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or inactive API key")
        profile = await db.get(Profile, api_key.created_by)
        if not profile:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API key owner not found")
        # Restrict API key to allowed endpoints only
        req_path = request.url.path
        if not any(req_path.startswith(p) for p in API_KEY_ALLOWED_PATHS):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="API key access is restricted to task and project endpoints only")

        user = await _build_user_from_profile(db, profile)
        user.is_api_key = True
        return user

    # JWT path (existing logic)
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

    email = payload.get("email", "")
    profile_result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()

    if profile:
        user = await _build_user_from_profile(db, profile)
        user.email = email or user.email
        return user

    return AuthenticatedUser(id=user_id, email=email)


DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
