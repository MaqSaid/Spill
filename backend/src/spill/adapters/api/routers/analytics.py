"""Analytics router — aggregated submission statistics (no content exposure)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from spill.adapters.api.dependencies import get_repository
from spill.adapters.api.routers.auth import verify_admin_session
from spill.adapters.db.repository import PostgresSubmissionRepository

router = APIRouter(
    prefix="/api/v1/admin/analytics",
    tags=["admin-analytics"],
    dependencies=[Depends(verify_admin_session)],
)


@router.get(
    "",
    summary="Submission analytics (admin)",
    description=(
        "Returns aggregated counts by category, impact, and status. "
        "No submission content is exposed."
    ),
)
async def get_analytics(
    repository: PostgresSubmissionRepository = Depends(get_repository),
) -> dict:
    """Return privacy-safe aggregated analytics."""
    total = await repository.count_all()
    by_category = await repository.count_by_category()
    by_status = await repository.count_by_status()
    by_impact = await repository.count_by_impact()

    return {
        "total": total,
        "by_category": by_category,
        "by_status": by_status,
        "by_impact": by_impact,
    }
