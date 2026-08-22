"""Simple in-memory rate limiter for admin endpoints.

Prevents brute-force enumeration of encrypted submissions.
Uses a sliding window approach with no identity tracking
(rate limits by endpoint, not by user — consistent with zero-knowledge).
"""

from __future__ import annotations

import time
from collections import deque
from collections.abc import Callable

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Rate limiter for admin endpoints.

    Since we cannot identify users (no IP, no auth), this is a
    global rate limiter that protects admin endpoints from being
    overwhelmed. It limits total requests to admin endpoints
    across all clients.

    This is intentionally coarse — fine-grained per-user limiting
    is impossible without identity tracking, which violates our
    zero-knowledge architecture.
    """

    def __init__(
        self,
        app: Callable[..., object],
        *,
        max_requests: int = 100,
        window_seconds: int = 60,
        path_prefix: str = "/api/v1/admin",
    ) -> None:
        super().__init__(app)
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._path_prefix = path_prefix
        self._requests: deque[float] = deque()

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Apply rate limiting to admin endpoints only."""
        if not request.url.path.startswith(self._path_prefix):
            return await call_next(request)

        now = time.monotonic()

        # Remove expired entries
        while self._requests and self._requests[0] <= now - self._window_seconds:
            self._requests.popleft()

        if len(self._requests) >= self._max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after_seconds": self._window_seconds,
                },
                headers={"Retry-After": str(self._window_seconds)},
            )

        self._requests.append(now)
        return await call_next(request)
