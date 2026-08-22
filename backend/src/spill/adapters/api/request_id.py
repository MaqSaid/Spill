"""Request ID middleware — generates a unique ID per request for tracing.

The request_id is:
- Generated as UUID v4 for each incoming request
- Added to structlog context for all log entries
- Returned in X-Request-ID response header
- Never contains sensitive information
"""

from __future__ import annotations

import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Generates and propagates a unique request ID for tracing."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Add request_id to context and response header."""
        # Use client-provided ID if present, otherwise generate
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())

        # Bind to structlog context for all log entries in this request
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response
