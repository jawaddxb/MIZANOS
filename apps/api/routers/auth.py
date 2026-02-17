"""Authentication router."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.dependencies import DbSession, CurrentUser
from apps.api.schemas.auth import (
    ActivateAccountRequest,
    ConfirmResetRequest,
    ForgotPasswordRequest,
    GoogleLoginRequest,
    InviteUserRequest,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from apps.api.schemas.base import MessageResponse
from apps.api.services.auth_service import AuthService

router = APIRouter()


def get_auth_service(db: DbSession) -> AuthService:
    return AuthService(db)


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, service: AuthService = Depends(get_auth_service)):
    """Authenticate user and return JWT tokens."""
    return await service.login(body.email, body.password)


@router.post("/google", response_model=LoginResponse)
async def google_login(body: GoogleLoginRequest, service: AuthService = Depends(get_auth_service)):
    """Authenticate existing user via Google Sign-In."""
    return await service.google_login(body.id_token)


@router.get("/me")
async def get_me(
    user: CurrentUser,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    """Get current authenticated user profile."""
    return await service.get_current_profile(user.id)


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, service: AuthService = Depends(get_auth_service)):
    """Register a new user."""
    return await service.register(body.email, body.password, body.full_name)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, service: AuthService = Depends(get_auth_service)):
    """Refresh access token using refresh token."""
    return await service.refresh_token(body.refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(user: CurrentUser):
    """Log out the current user."""
    return MessageResponse(message="Logged out successfully")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    body: ResetPasswordRequest,
    user: CurrentUser,
    service: AuthService = Depends(get_auth_service),
):
    """Reset the current user's password."""
    await service.reset_password(user.id, body.new_password)
    return MessageResponse(message="Password reset successfully")


@router.post("/invite", response_model=MessageResponse)
async def invite_user(
    body: InviteUserRequest,
    user: CurrentUser,
    service: AuthService = Depends(get_auth_service),
):
    """Invite a new user to the platform."""
    await service.invite_user(body.email, body.full_name, body.role)
    return MessageResponse(message="Invitation sent")


@router.post("/activate", response_model=MessageResponse)
async def activate_account(
    body: ActivateAccountRequest,
    service: AuthService = Depends(get_auth_service),
):
    """Activate an invited account using an invitation token."""
    result = await service.activate_account(body.token, body.password)
    return MessageResponse(message=result["message"])


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    """Request a password reset email."""
    result = await service.forgot_password(body.email)
    return MessageResponse(message=result["message"])


@router.post("/confirm-reset", response_model=MessageResponse)
async def confirm_reset(
    body: ConfirmResetRequest,
    service: AuthService = Depends(get_auth_service),
):
    """Reset password using a reset token."""
    result = await service.confirm_reset(body.token, body.new_password)
    return MessageResponse(message=result["message"])
