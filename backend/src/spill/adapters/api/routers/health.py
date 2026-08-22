"""Health check router — liveness and readiness probes."""

from __future__ import annotations

from fastapi import APIRouter

from spill import __version__

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    summary="Basic health check",
    description="Returns healthy status and version. Used for basic monitoring.",
)
async def health() -> dict[str, str]:
    """Basic health check — confirms process is running."""
    return {"status": "healthy", "version": __version__}


@router.get(
    "/health/live",
    summary="Liveness probe",
    description="Returns 200 if the process is alive. No dependency checks.",
)
async def liveness() -> dict[str, str]:
    """Liveness probe — confirms process is alive."""
    return {"status": "alive"}


@router.get(
    "/health/ready",
    summary="Readiness probe",
    description="Returns 200 if the application is ready to serve traffic (DB connected).",
)
async def readiness() -> dict[str, str]:
    """Readiness probe — checks database connectivity."""
    try:
        from sqlalchemy import text

        from spill.adapters.api.dependencies import get_db_session

        async for session in get_db_session():
            await session.execute(text("SELECT 1"))
            return {"status": "ready", "database": "connected"}
    except Exception:
        from fastapi.responses import JSONResponse

        return JSONResponse(  # type: ignore[return-value]
            status_code=503,
            content={"status": "not_ready", "database": "disconnected"},
        )
