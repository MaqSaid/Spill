"""Admin authentication router — login/logout endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from spill.adapters.api.dependencies import get_admin_auth_service
from spill.core.services.admin_auth import AdminAuthService

router = APIRouter(prefix="/api/v1/admin", tags=["admin-auth"])


class LoginRequest(BaseModel):
    """Admin login request — token + TOTP code."""

    token: str
    totp_code: str

    model_config = {"extra": "forbid"}


class LoginResponse(BaseModel):
    """Login success response — session token for subsequent requests."""

    session_token: str
    expires_in: int  # seconds


@router.post(
    "/auth/login",
    response_model=LoginResponse,
    summary="Admin login (token + TOTP)",
    description="Authenticate with admin token and TOTP code. Returns a session token.",
)
async def admin_login(
    body: LoginRequest,
    auth_service: AdminAuthService = Depends(get_admin_auth_service),
) -> LoginResponse:
    """Authenticate admin and return session token."""
    if auth_service.is_locked:
        raise HTTPException(
            status_code=423,
            detail="Account is temporarily locked due to too many failed attempts. Try again later.",
        )

    session_token = auth_service.authenticate(body.token, body.totp_code)

    if session_token is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials.",
        )

    return LoginResponse(
        session_token=session_token,
        expires_in=28800,
    )


@router.post(
    "/auth/logout",
    summary="Admin logout",
    description="Invalidate the current admin session.",
)
async def admin_logout(
    authorization: str | None = Header(default=None),
    auth_service: AdminAuthService = Depends(get_admin_auth_service),
) -> dict[str, str]:
    """Invalidate the admin session."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        auth_service.invalidate_session(token)

    return {"detail": "Logged out successfully."}


async def verify_admin_session(
    authorization: str | None = Header(default=None),
    auth_service: AdminAuthService = Depends(get_admin_auth_service),
) -> None:
    """FastAPI dependency — verifies admin session on protected endpoints."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please login at /api/v1/admin/auth/login.",
        )

    session_token = authorization[7:]
    if not auth_service.validate_session(session_token):
        raise HTTPException(
            status_code=401,
            detail="Session expired or invalid. Please login again.",
        )
