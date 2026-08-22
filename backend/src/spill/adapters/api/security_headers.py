"""Security headers middleware — adds defensive HTTP headers to all responses.

Implements Essential Eight control #4 (User Application Hardening)
and OWASP secure headers recommendations.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security headers to every HTTP response.

    Headers added:
    - Strict-Transport-Security (HSTS)
    - X-Content-Type-Options (prevent MIME sniffing)
    - X-Frame-Options (prevent clickjacking)
    - Referrer-Policy (prevent referrer leakage)
    - Permissions-Policy (disable unnecessary browser APIs)
    - Content-Security-Policy (restrict resource loading)
    - Cache-Control (prevent caching of sensitive data)
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Add security headers to the response."""
        response = await call_next(request)

        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; "
            "base-uri 'self'; form-action 'self'"
        )
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"

        # Remove server version header if present
        if "server" in response.headers:
            del response.headers["server"]

        return response
