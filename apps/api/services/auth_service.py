"""Authentication service with JWT + bcrypt."""

import secrets
import uuid as uuid_mod
from datetime import datetime, timedelta, timezone
from uuid import UUID

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
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
                "profile_id": str(profile.id),
                "email": profile.email,
                "full_name": profile.full_name,
                "role": profile.role,
                "avatar_url": profile.avatar_url,
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
            "profile_id": str(profile.id),
            "email": profile.email,
            "full_name": profile.full_name,
            "role": profile.role,
            "avatar_url": profile.avatar_url,
        }

    async def validate_activation_token(self, token: str) -> dict:
        """Check if an activation token is valid without consuming it."""
        from apps.api.models.user import InvitationToken

        stmt = select(InvitationToken).where(InvitationToken.token == token)
        result = await self.session.execute(stmt)
        inv = result.scalar_one_or_none()

        if not inv:
            raise bad_request("Invalid activation token")
        if inv.used_at is not None:
            raise bad_request("This activation link has already been used")
        if not inv.is_active:
            raise bad_request("This activation link is no longer valid. Please request a new one.")
        if inv.expires_at < datetime.now(timezone.utc):
            raise bad_request("This activation link has expired")

        return {"valid": True}

    async def activate_account(self, token: str, password: str) -> dict:
        """Activate account using an invitation token."""
        from apps.api.models.user import InvitationToken, Profile

        stmt = select(InvitationToken).where(InvitationToken.token == token)
        result = await self.session.execute(stmt)
        inv = result.scalar_one_or_none()

        if not inv:
            raise bad_request("Invalid activation token")
        if inv.used_at is not None:
            raise bad_request("This activation link has already been used")
        if not inv.is_active:
            raise bad_request("This activation link is no longer valid. Please request a new one.")
        if inv.expires_at < datetime.now(timezone.utc):
            raise bad_request("This activation link has expired")

        inv.used_at = datetime.now(timezone.utc)
        inv.is_active = False

        profile = await self.session.get(Profile, inv.profile_id)
        if not profile:
            raise bad_request("User account not found")

        profile.password_hash = self._hash_password(password)
        profile.status = "active"
        profile.must_reset_password = False
        await self.session.flush()

        return {"message": "Account activated successfully. You can now log in."}

    async def forgot_password(self, email: str) -> dict:
        """Send a password reset email. Always returns success to avoid leaking info."""
        from apps.api.models.user import PasswordResetToken, Profile
        from apps.api.services.email_service import EmailService

        stmt = select(Profile).where(func.lower(Profile.email) == email.lower())
        result = await self.session.execute(stmt)
        profile = result.scalar_one_or_none()

        if profile and profile.status == "active":
            token_value = secrets.token_urlsafe(48)
            reset_token = PasswordResetToken(
                profile_id=profile.id,
                token=token_value,
                expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            )
            self.session.add(reset_token)
            await self.session.flush()

            link = f"{settings.app_base_url}/reset-password?token={token_value}"
            await EmailService.send_password_reset_email(
                to_email=email,
                full_name=profile.full_name or "User",
                reset_link=link,
            )

        return {"message": "If an account with that email exists, a reset link has been sent."}

    async def confirm_reset(self, token: str, new_password: str) -> dict:
        """Reset password using a password reset token."""
        from apps.api.models.user import PasswordResetToken, Profile

        stmt = select(PasswordResetToken).where(PasswordResetToken.token == token)
        result = await self.session.execute(stmt)
        reset = result.scalar_one_or_none()

        if not reset:
            raise bad_request("Invalid reset token")
        if reset.used_at is not None:
            raise bad_request("This reset link has already been used")
        if reset.expires_at < datetime.now(timezone.utc):
            raise bad_request("This reset link has expired")

        reset.used_at = datetime.now(timezone.utc)

        profile = await self.session.get(Profile, reset.profile_id)
        if not profile:
            raise bad_request("User account not found")

        profile.password_hash = self._hash_password(new_password)
        profile.must_reset_password = False
        await self.session.flush()

        return {"message": "Password reset successfully. You can now log in."}

    async def google_login(self, id_token_str: str) -> dict:
        """Authenticate an existing user via Google ID token."""
        from apps.api.models.user import Profile

        email = self._verify_google_id_token(id_token_str)

        stmt = select(Profile).where(func.lower(Profile.email) == email.lower())
        result = await self.session.execute(stmt)
        profile = result.scalar_one_or_none()

        if not profile:
            raise bad_request("No account found for this Google email. Please sign up first.")

        if profile.status == "suspended":
            raise forbidden("Your account has been suspended. Contact your administrator.")

        if profile.status != "active":
            raise bad_request("Your account is not yet active. Please check your email for an activation link.")

        profile.last_login = datetime.now(timezone.utc)
        await self.session.flush()

        tokens = self._create_tokens(str(profile.user_id), profile.email)
        return {
            **tokens,
            "must_reset_password": False,
            "user": {
                "id": str(profile.user_id),
                "profile_id": str(profile.id),
                "email": profile.email,
                "full_name": profile.full_name,
                "role": profile.role,
                "avatar_url": profile.avatar_url,
            },
        }

    @staticmethod
    def _verify_google_id_token(id_token_str: str) -> str:
        """Verify a Google ID token and return the email address."""
        if not settings.google_oauth_client_id:
            raise bad_request("Google Sign-In is not configured on this server.")

        try:
            id_info = google_id_token.verify_oauth2_token(
                id_token_str,
                google_requests.Request(),
                settings.google_oauth_client_id,
            )
        except ValueError as e:
            raise bad_request(f"Invalid Google token: {e}")

        if not id_info.get("email_verified"):
            raise bad_request("Google email is not verified.")

        email = id_info.get("email")
        if not email:
            raise bad_request("No email found in Google token.")

        return email

    def _create_tokens(self, user_id: str, email: str) -> dict:
        """Generate JWT access and refresh tokens."""
        now = datetime.now(timezone.utc)
        base = {"sub": user_id, "email": email, "iat": now}
        access_payload = {**base, "exp": now + timedelta(minutes=settings.jwt_access_token_expire_minutes)}
        refresh_payload = {**base, "exp": now + timedelta(days=settings.jwt_refresh_token_expire_days), "type": "refresh"}
        return {
            "access_token": jwt.encode(access_payload, settings.jwt_secret_key, settings.jwt_algorithm),
            "refresh_token": jwt.encode(refresh_payload, settings.jwt_secret_key, settings.jwt_algorithm),
            "token_type": "bearer",
        }

    @staticmethod
    def _hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def _verify_password(plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)
