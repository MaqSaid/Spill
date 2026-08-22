"""FastAPI application factory — assembles the ASGI application."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from spill import __version__
from spill.adapters.api.middleware import MetadataPurgingMiddleware
from spill.adapters.api.rate_limiter import RateLimiterMiddleware
from spill.adapters.api.routers import admin, health, submissions
from spill.config.settings import get_settings


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Middleware order matters:
    1. CORS (outermost — handles preflight before anything else)
    2. MetadataPurging (strips identifying info before reaching routes)
    """
    settings = get_settings()

    app = FastAPI(
        title="Spill API",
        description="Zero-Knowledge Anonymous Employee Feedback Platform",
        version=__version__,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )

    # ─── Middleware Stack ─────────────────────────────────────────────────────
    # CORS — must be added first (outermost)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,  # No cookies/auth for anonymous submissions
        allow_methods=["GET", "POST", "PATCH"],
        allow_headers=["Content-Type"],
    )

    # Privacy: strip all identifying metadata
    app.add_middleware(MetadataPurgingMiddleware)

    # Rate limiting: protect admin endpoints from brute-force enumeration
    app.add_middleware(RateLimiterMiddleware)

    # ─── Route Registration ───────────────────────────────────────────────────
    app.include_router(health.router)
    app.include_router(submissions.router)
    app.include_router(admin.router)

    return app
