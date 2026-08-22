"""FastAPI application factory — assembles the ASGI application."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from spill import __version__
from spill.adapters.api.logging_config import configure_logging
from spill.adapters.api.maintenance import MaintenanceModeMiddleware
from spill.adapters.api.middleware import MetadataPurgingMiddleware
from spill.adapters.api.rate_limiter import RateLimiterMiddleware
from spill.adapters.api.request_hardening import RequestHardeningMiddleware
from spill.adapters.api.request_id import RequestIdMiddleware
from spill.adapters.api.routers import admin, analytics, auth, health, public_key, submissions
from spill.adapters.api.security_headers import SecurityHeadersMiddleware
from spill.config.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan — startup and shutdown logic."""
    configure_logging()
    yield
    # Shutdown: clean up database connections
    from spill.adapters.api.dependencies import _engine

    if _engine is not None:
        await _engine.dispose()


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Middleware order (innermost to outermost in execution):
    1. CORS (outermost — handles preflight before anything else)
    2. Security Headers (add defensive headers to all responses)
    3. Maintenance Mode (kill switch — blocks all traffic if enabled)
    4. MetadataPurging (strips identifying info before reaching routes)
    5. Rate Limiting (protect admin endpoints)
    6. Request ID (innermost — generates trace ID for logging)
    """
    settings = get_settings()

    app = FastAPI(
        title="Spill API",
        description="Zero-Knowledge Anonymous Employee Feedback Platform",
        version=__version__,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # ─── Middleware Stack ─────────────────────────────────────────────────────
    # Note: FastAPI/Starlette middleware executes in REVERSE order of add_middleware calls
    # So the LAST added middleware is the OUTERMOST (first to process request)

    # Request hardening: body size limits + content-type enforcement
    app.add_middleware(RequestHardeningMiddleware)

    # Rate limiting: protect admin endpoints from brute-force enumeration
    app.add_middleware(RateLimiterMiddleware)

    # Request ID: generate unique trace ID for every request (innermost)
    app.add_middleware(RequestIdMiddleware)

    # Privacy: strip all identifying metadata
    app.add_middleware(MetadataPurgingMiddleware)

    # Maintenance mode: kill switch (blocks requests when enabled)
    app.add_middleware(MaintenanceModeMiddleware)

    # Security headers: add defensive headers to all responses
    app.add_middleware(SecurityHeadersMiddleware)

    # CORS — must be outermost (handles preflight before anything else)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,  # No cookies/auth for anonymous submissions
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # ─── Route Registration ───────────────────────────────────────────────────
    app.include_router(health.router)
    app.include_router(public_key.router)
    app.include_router(submissions.router)
    app.include_router(auth.router)
    app.include_router(admin.router)
    app.include_router(analytics.router)

    # ─── Metrics (Prometheus) ─────────────────────────────────────────────────
    Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

    return app
