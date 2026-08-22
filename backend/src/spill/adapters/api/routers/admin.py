"""Admin router — management portal endpoints for submission review."""
# ruff: noqa: B008 — Depends() in defaults is the standard FastAPI DI pattern

from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query

from spill.adapters.api.dependencies import get_manage_use_case
from spill.adapters.api.routers.auth import verify_admin_session
from spill.adapters.api.schemas import (
    AdminListResponse,
    AdminSubmissionItem,
    UpdateStatusRequest,
)
from spill.config.settings import get_settings
from spill.core.use_cases.manage_submissions import ManageSubmissionsUseCase

router = APIRouter(prefix="/api/v1/admin", tags=["admin"], dependencies=[Depends(verify_admin_session)])


@router.get(
    "/submissions",
    response_model=AdminListResponse,
    summary="List all submissions (admin)",
    description="Paginated list of all submissions with encrypted payloads for admin decryption.",
)
async def list_submissions(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    use_case: ManageSubmissionsUseCase = Depends(get_manage_use_case),
) -> AdminListResponse:
    """List all submissions for the admin portal."""
    result = await use_case.list_submissions(limit=limit, offset=offset)
    sla_cutoff = date.today() - timedelta(days=7)

    return AdminListResponse(
        items=[
            AdminSubmissionItem(
                id=item.id,
                category=item.category,
                impact=item.impact,
                encrypted_payload=item.encrypted_payload,
                encryption_iv=item.encryption_iv,
                encrypted_symmetric_key=item.encrypted_symmetric_key,
                status=item.status,
                submitted_date=item.submitted_date,
                status_note=item.status_note,
                sla_breached=item.submitted_date < sla_cutoff and item.status != SubmissionStatus.RESOLVED,
            )
            for item in result.items
        ],
        total=result.total,
        limit=result.limit,
        offset=result.offset,
    )


@router.get(
    "/submissions/{submission_id}",
    response_model=AdminSubmissionItem,
    summary="Get single submission (admin)",
)
async def get_submission(
    submission_id: str,
    use_case: ManageSubmissionsUseCase = Depends(get_manage_use_case),
) -> AdminSubmissionItem:
    """Get a single submission by ID."""
    result = await use_case.get_submission(submission_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Submission not found")

    return AdminSubmissionItem(
        id=result.id,
        category=result.category,
        impact=result.impact,
        encrypted_payload=result.encrypted_payload,
        encryption_iv=result.encryption_iv,
        encrypted_symmetric_key=result.encrypted_symmetric_key,
        status=result.status,
        submitted_date=result.submitted_date,
        status_note=result.status_note,
    )


@router.patch(
    "/submissions/{submission_id}/status",
    response_model=AdminSubmissionItem,
    summary="Update submission status (admin)",
)
async def update_submission_status(
    submission_id: str,
    body: UpdateStatusRequest,
    use_case: ManageSubmissionsUseCase = Depends(get_manage_use_case),
) -> AdminSubmissionItem:
    """Update the status of a submission (enforces state machine transitions)."""
    try:
        result = await use_case.update_status(submission_id, body.status, body.note)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    if result is None:
        raise HTTPException(status_code=404, detail="Submission not found")

    return AdminSubmissionItem(
        id=result.id,
        category=result.category,
        impact=result.impact,
        encrypted_payload=result.encrypted_payload,
        encryption_iv=result.encryption_iv,
        encrypted_symmetric_key=result.encrypted_symmetric_key,
        status=result.status,
        submitted_date=result.submitted_date,
        status_note=result.status_note,
    )


@router.post(
    "/emergency/lockdown",
    summary="Emergency lockdown (admin)",
    description="Disables all submissions immediately. Requires server restart or env change to re-enable.",
)
async def emergency_lockdown() -> dict[str, str]:
    """Activate emergency lockdown — disable submissions at runtime."""
    settings = get_settings()
    # Note: This modifies the cached settings instance at runtime
    # A proper implementation would use a shared state store (Redis)
    # For now, this persists until the process restarts
    settings.submissions_enabled = False
    return {"detail": "Emergency lockdown activated. Submissions disabled."}


@router.post(
    "/public-key",
    summary="Upload organization public key (admin)",
    description="Store the org RSA public key for employee encryption. Persists via environment override.",
)
async def upload_public_key(body: dict) -> dict[str, str]:
    """Store the organization's public key (runtime only — persists until restart)."""
    public_key = body.get("public_key", "")
    if not public_key or "BEGIN PUBLIC KEY" not in public_key:
        raise HTTPException(status_code=422, detail="Invalid PEM public key format.")

    settings = get_settings()
    settings.org_public_key = public_key
    return {"detail": "Public key updated successfully."}
