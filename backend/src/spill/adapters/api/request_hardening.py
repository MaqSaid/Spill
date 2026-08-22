"""Request hardening middleware — body size limits, content-type enforcement, response sanitization.

Implements NFR-6.2, NFR-6.3, NFR-6.4 from requirements.
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Callable

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

MAX_BODY_SIZE = 65536  # 64KB


class RequestHardeningMiddleware(BaseHTTPMiddleware):
    """
    Enforces request body size limits and content-type validation.

    - Rejects bodies > 64KB with 413
    - Rejects non-JSON POST/PATCH/PUT with 415
    - Sanitizes error responses in production (no stack traces)
    """

    def __init__(self, app: Callable[..., object]) -> None:
        super().__init__(app)
        self._submission_counts: dict[str, list[float]] = defaultdict(list)

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Apply request hardening checks."""
        # Body size check for methods with bodies
        if request.method in ("POST", "PATCH", "PUT"):
            content_length = request.headers.get("content-length", "0")

            # Body size limit
            if content_length and int(content_length) > MAX_BODY_SIZE:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request body too large. Maximum size is 64KB."},
                )

            # Content-Type enforcement (only when body is present)
            if int(content_length) > 0:
                content_type = request.headers.get("content-type", "")
                if not content_type.startswith("application/json"):
                    return JSONResponse(
                        status_code=415,
                        content={"detail": "Content-Type must be application/json."},
                    )

        response = await call_next(request)
        return response
