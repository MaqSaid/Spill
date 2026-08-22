"""Privacy middleware — strips identifying metadata before processing.

This is the critical privacy-enforcement layer. It ensures that no
identifying information (IP addresses, User-Agent strings, etc.)
reaches the application or database layer.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class MetadataPurgingMiddleware(BaseHTTPMiddleware):
    """
    Strips identifying metadata from all incoming requests.

    Removes:
    - X-Forwarded-For headers
    - X-Real-IP headers
    - User-Agent strings
    - Client connection info from scope

    This middleware ensures zero-knowledge privacy by preventing
    any identifying information from being logged or stored.
    """

    PURGED_HEADERS = frozenset(
        {
            "x-forwarded-for",
            "x-real-ip",
            "x-client-ip",
            "cf-connecting-ip",
            "true-client-ip",
            "user-agent",
            "x-forwarded-host",
            "x-forwarded-proto",
            "forwarded",
            "via",
        }
    )

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Strip identifying headers and override client address."""
        # Purge identifying headers from the scope
        purged_headers: list[tuple[bytes, bytes]] = []
        for key, value in request.scope.get("headers", []):
            header_name = key.decode("latin-1").lower()
            if header_name not in self.PURGED_HEADERS:
                purged_headers.append((key, value))

        # Replace headers in the ASGI scope
        request.scope["headers"] = purged_headers

        # Override client address with a null value
        request.scope["client"] = ("0.0.0.0", 0)

        response = await call_next(request)
        return response  # noqa: RET504
