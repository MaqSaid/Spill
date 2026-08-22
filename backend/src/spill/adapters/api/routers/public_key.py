"""Public key router — serves the organization's RSA public key for client-side encryption."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from spill.config.settings import get_settings

router = APIRouter(tags=["encryption"])


@router.get(
    "/api/v1/public-key",
    summary="Get organization public key",
    description="Returns the organization's RSA public key (PEM) for client-side encryption. "
    "Employees use this to encrypt feedback before submission.",
)
async def get_public_key() -> dict[str, str]:
    """Serve the organization's RSA-OAEP public key for encryption."""
    settings = get_settings()

    if not settings.org_public_key:
        raise HTTPException(
            status_code=404,
            detail="Encryption not configured. Contact your administrator.",
        )

    return {"public_key": settings.org_public_key}
