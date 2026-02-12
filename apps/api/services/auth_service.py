"""Authentication service with JWT + bcrypt."""

import secrets
import uuid as uuid_mod
from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from packages.common.utils.error_handlers import bad_request, forbidden

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Handles authentication, token generation, and user management."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def login(self, email: str, password: str) -> dict:
        """Authenticate user and return tokens."""
        from apps.api.models.user import Profile

        stmt = select(Profile).where(func.lower(Profile.email) == email.lower())
        result = await self.session.execute(stmt)
        profile = result.scalar_one_or_none()

        if not profile or not self._verify_password(password, profile.password_hash or ""):
            raise bad_request("Invalid email or password")

        if profile.status == "suspended":
            raise forbidden("Your account has been suspended. Contact your administrator.")

        must_reset = bool(getattr(profile, "must_reset_password", False))

        # Update last login
        profile.last_login = datetime.now(timezone.utc)
        await self.session.flush()

        tokens = self._create_tokens(str(profile.user_id), email)
        return {
            **tokens,
            "must_reset_password": must_reset,
            "user": {
                "id": str(profile.user_id),
                "email": profile.email,
                "full_name": profile.full_name,
            },
        }

    async def register(self, email: str, password: str, full_name: str) -> dict:
        """Register a new user."""
        from apps.api.models.user import Profile

        # Check existing
        stmt = select(Profile).where(func.lower(Profile.email) == email.lower())
        result = await self.session.execute(stmt)
        if result.scalar_one_or_none():
            raise bad_request("Email already registered")

        hashed = self._hash_password(password)
        new_id = uuid_mod.uuid4()
        profile = Profile(
            id=new_id,
            user_id=str(new_id),
            email=email,
            password_hash=hashed,
            full_name=full_name,
            status="active",
        )
        self.session.add(profile)
        await self.session.flush()
        await self.session.refresh(profile)

        tokens = self._create_tokens(str(profile.user_id), email)
        return {**tokens, "must_reset_password": False}

    async def refresh_token(self, refresh_token: str) -> dict:
        """Generate new access token from refresh token."""
        try:
            payload = jwt.decode(
                refresh_token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm],
            )
            user_id = payload.get("sub")
            email = payload.get("email", "")
            if not user_id or payload.get("type") != "refresh":
                raise bad_request("Invalid refresh token")
        except Exception:
            raise bad_request("Invalid or expired refresh token")

        tokens = self._create_tokens(user_id, email)
        return {**tokens, "must_reset_password": False}

    async def reset_password(self, user_id: str, new_password: str) -> None:
        """Reset user password."""
        from apps.api.models.user import Profile

        stmt = select(Profile).where(Profile.user_id == UUID(user_id))
        result = await self.session.execute(stmt)
        profile = result.scalar_one_or_none()
        if not profile:
            raise bad_request("User not found")

        profile.password_hash = self._hash_password(new_password)
        profile.must_reset_password = False
        await self.session.flush()

    async def get_current_profile(self, user_id: str) -> dict:
        """Get profile for the current authenticated user."""
        from apps.api.models.user import Profile

        stmt = select(Profile).where(Profile.user_id == user_id)
        result = await self.session.execute(stmt)
        profile = result.scalar_one_or_none()
        if not profile:
            raise bad_request("User not found")
        return {
            "id": str(profile.user_id),
            "email": profile.email,
            "full_name": profile.full_name,
            "role": profile.role,
        }

    async def invite_user(self, email: str, full_name: str, role: str) -> None:
        """Create an invited user with a temporary password."""
        temp_password = secrets.token_urlsafe(16)
        await self.register(email, temp_password, full_name)
        # TODO: Send invitation email with temp_password

    def _create_tokens(self, user_id: str, email: str) -> dict:
        """Generate JWT access and refresh tokens."""
        now = datetime.now(timezone.utc)
        access_payload = {
            "sub": user_id,
            "email": email,
            "exp": now + timedelta(minutes=settings.jwt_access_token_expire_minutes),
            "iat": now,
        }
        refresh_payload = {
            "sub": user_id,
            "email": email,
            "exp": now + timedelta(days=settings.jwt_refresh_token_expire_days),
            "iat": now,
            "type": "refresh",
        }
        access_token = jwt.encode(access_payload, settings.jwt_secret_key, settings.jwt_algorithm)
        refresh_token = jwt.encode(refresh_payload, settings.jwt_secret_key, settings.jwt_algorithm)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    @staticmethod
    def _hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def _verify_password(plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)
