"""Structured logging configuration using structlog.

Rules (from observability.md steering):
- JSON output in production, human-readable in dev
- Every entry includes: timestamp, level, request_id, event
- NEVER log: encrypted_payload, encryption_iv, encrypted_symmetric_key, receipt_hash, tokens
"""

from __future__ import annotations

import logging
import sys

import structlog

from spill.config.settings import get_settings


def configure_logging() -> None:
    """Configure structlog for the application."""
    settings = get_settings()
    is_debug = settings.debug

    # Shared processors
    shared_processors: list = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if is_debug:
        # Development: human-readable console output
        shared_processors.append(structlog.dev.ConsoleRenderer())
    else:
        # Production: JSON output
        shared_processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=shared_processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure standard library logging level
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )


def get_logger(name: str = __name__) -> structlog.stdlib.BoundLogger:
    """Get a structlog logger instance."""
    return structlog.get_logger(name)
