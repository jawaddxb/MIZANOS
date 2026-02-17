"""Authentication schemas."""

import re

from pydantic import BaseModel, EmailStr, Field, field_validator

PASSWORD_PATTERN = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:'\",.<>?/\\|`~]).{8,}$"
)
PASSWORD_MSG = (
    "Password must be at least 8 characters and include an uppercase letter, "
    "a lowercase letter, a number, and a special character."
)


def _validate_password(value: str) -> str:
    if not PASSWORD_PATTERN.match(value):
        raise ValueError(PASSWORD_MSG)
    return value


class LoginRequest(BaseModel):
    """Login request body."""

    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Registration request body."""

    email: EmailStr
    password: str
    full_name: str

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return _validate_password(v)


class TokenResponse(BaseModel):
    """JWT token pair response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    must_reset_password: bool = False


class UserResponse(BaseModel):
    """User info returned in login response."""

    id: str
    email: str
    full_name: str | None = None
    role: str | None = None


class LoginResponse(BaseModel):
    """Login response with tokens and user info."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    must_reset_password: bool = False
    user: UserResponse


class RefreshRequest(BaseModel):
    """Token refresh request."""

    refresh_token: str


class ResetPasswordRequest(BaseModel):
    """Password reset request."""

    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return _validate_password(v)


class InviteUserRequest(BaseModel):
    """Invite a new user."""

    email: EmailStr
    full_name: str
    role: str = "engineer"


class GoogleLoginRequest(BaseModel):
    """Google Sign-In request body."""

    id_token: str


class ActivateAccountRequest(BaseModel):
    """Activate account with invitation token."""

    token: str
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return _validate_password(v)


class ForgotPasswordRequest(BaseModel):
    """Request a password reset email."""

    email: EmailStr


class ConfirmResetRequest(BaseModel):
    """Confirm password reset with token."""

    token: str
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return _validate_password(v)
