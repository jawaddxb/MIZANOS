"""Authentication schemas."""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Login request body."""

    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Registration request body."""

    email: EmailStr
    password: str
    full_name: str


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


class ForgotPasswordRequest(BaseModel):
    """Request a password reset email."""

    email: EmailStr


class ConfirmResetRequest(BaseModel):
    """Confirm password reset with token."""

    token: str
    new_password: str = Field(..., min_length=8)
