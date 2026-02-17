"""Dependency injection for FastAPI routes."""

from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.models.enums import AppRole
from packages.common.db.session import async_session_factory

security = HTTPBearer()


@dataclass
class AuthenticatedUser:
    """Represents the currently authenticated user with role info."""

    id: str
    email: str
    profile_id: UUID | None = None
    role: str | None = None
    additional_roles: list[str] = field(default_factory=list)

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


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthenticatedUser:
    """Extract and validate the current user from JWT token."""
    from apps.api.models.user import Profile, UserRole

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    email = payload.get("email", "")

    profile_result = await db.execute(
        select(Profile).where(Profile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()

    roles_result = await db.execute(
        select(UserRole.role).where(UserRole.user_id == user_id)
    )
    additional_roles = [r for (r,) in roles_result.all()]

    return AuthenticatedUser(
        id=user_id,
        email=email or (profile.email if profile else ""),
        profile_id=profile.id if profile else None,
        role=profile.role if profile else None,
        additional_roles=additional_roles,
    )


DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
