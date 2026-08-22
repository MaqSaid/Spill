"""Health router — application health check endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from spill import __version__
from spill.adapters.api.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
)
async def health_check() -> HealthResponse:
    """Application health check endpoint."""
    return HealthResponse(status="healthy", version=__version__)
