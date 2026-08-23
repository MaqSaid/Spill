"""Background tasks — scheduled operations like data retention cleanup."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime, timedelta

from spill.config.settings import get_settings

logger = logging.getLogger(__name__)


async def retention_cleanup_loop() -> None:
    """Run daily retention cleanup as a background task.

    Deletes RESOLVED submissions older than SPILL_RETENTION_DAYS.
    Logs only the count of deleted rows (never content or identifiers).
    """
    settings = get_settings()

    while True:
        # Wait until next cleanup window (run once daily at ~3 AM UTC)
        await asyncio.sleep(86400)  # 24 hours

        try:
            from spill.adapters.api.dependencies import _get_session_factory

            factory = _get_session_factory()
            async with factory() as session:
                from spill.adapters.db.repository import PostgresSubmissionRepository

                repo = PostgresSubmissionRepository(session)
                cutoff = datetime.now(UTC).date() - timedelta(days=settings.retention_days)
                deleted_count = await repo.delete_resolved_before(cutoff)

                if deleted_count > 0:
                    logger.info(
                        "retention_cleanup",
                        extra={
                            "deleted_count": deleted_count,
                            "retention_days": settings.retention_days,
                        },
                    )
        except Exception:
            logger.exception("retention_cleanup_failed")
