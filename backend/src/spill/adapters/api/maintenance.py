"""Maintenance mode middleware — kill switch for the application.

Supports two levels:
1. Full maintenance (SPILL_MAINTENANCE=true): all endpoints return 503
2. Submissions disabled (SPILL_SUBMISSIONS_ENABLED=false): only submissions blocked
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from spill.config.settings import get_settings


class MaintenanceModeMiddleware(BaseHTTPMiddleware):
    """
    Kill switch middleware — disables the application when in maintenance mode.

    Levels:
    - SPILL_MAINTENANCE=true: returns 503 on everything except /health
    - SPILL_SUBMISSIONS_ENABLED=false: blocks POST /api/v1/submissions only
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Check maintenance mode before processing requests."""
        settings = get_settings()

        # Level 1: Full maintenance mode
        if settings.maintenance:
            # Allow health checks through for orchestrator probes
            if request.url.path in ("/health", "/health/live", "/health/ready"):
                return await call_next(request)

            return JSONResponse(
                status_code=503,
                content={
                    "detail": "System is under maintenance. Please try again later.",
                    "status": "maintenance",
                },
                headers={"Retry-After": "3600"},
            )

        # Level 2: Submissions disabled only
        if (
            not settings.submissions_enabled
            and request.url.path == "/api/v1/submissions"
            and request.method == "POST"
        ):
            return JSONResponse(
                status_code=503,
                content={
                    "detail": "Submissions are temporarily disabled. Please try again later.",
                    "status": "submissions_disabled",
                },
                headers={"Retry-After": "3600"},
            )

        return await call_next(request)
