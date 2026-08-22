"""Submissions router — anonymous feedback submission and status check endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from spill.adapters.api.dependencies import get_repository, get_status_use_case, get_submit_use_case
from spill.adapters.api.schemas import (
    StatusCheckRequest,
    StatusCheckResponse,
    StatusItem,
    SubmitFeedbackRequest,
    SubmitFeedbackResponse,
)
from spill.core.use_cases.check_status import CheckStatusUseCase
from spill.core.use_cases.submit_feedback import (
    SubmitFeedbackInput,
    SubmitFeedbackUseCase,
)

router = APIRouter(prefix="/api/v1/submissions", tags=["submissions"])


@router.post(
    "",
    response_model=SubmitFeedbackResponse,
    status_code=201,
    summary="Submit anonymous feedback",
    description="Submit encrypted anonymous feedback. No authentication required.",
)
async def submit_feedback(
    body: SubmitFeedbackRequest,
    use_case: SubmitFeedbackUseCase = Depends(get_submit_use_case),
) -> SubmitFeedbackResponse:
    """Create a new anonymous submission with client-side encrypted payload."""
    input_data = SubmitFeedbackInput(
        category=body.category,
        impact=body.impact,
        encrypted_payload=body.encrypted_payload,
        encryption_iv=body.encryption_iv,
        encrypted_symmetric_key=body.encrypted_symmetric_key,
        receipt_hash=body.receipt_hash,
    )

    result = await use_case.execute(input_data)

    return SubmitFeedbackResponse(
        submission_id=result.submission_id,
        status=result.status,
        submitted_date=result.submitted_date,
    )


@router.post(
    "/status",
    response_model=StatusCheckResponse,
    summary="Check submission status",
    description="Look up submission statuses using the receipt hash from sessionStorage.",
)
async def check_status(
    body: StatusCheckRequest,
    use_case: CheckStatusUseCase = Depends(get_status_use_case),
) -> StatusCheckResponse:
    """Retrieve all submission statuses for the current session."""
    results = await use_case.execute(body.receipt_hash)

    return StatusCheckResponse(
        submissions=[
            StatusItem(
                submission_id=r.submission_id,
                category=r.category,
                impact=r.impact,
                status=r.status,
                submitted_date=r.submitted_date,
                status_note=r.status_note,
            )
            for r in results
        ]
    )


@router.delete(
    "/{submission_id}",
    status_code=200,
    summary="Withdraw a submission (within 24 hours)",
    description="Delete a submission within 24 hours of creation. Requires receipt_hash proof.",
)
async def withdraw_submission(
    submission_id: str,
    body: StatusCheckRequest,
    use_case: SubmitFeedbackUseCase = Depends(get_submit_use_case),
    repository=Depends(get_repository),
) -> dict[str, str]:
    """Withdraw (delete) a submission within 24-hour window."""
    from datetime import UTC, datetime

    # Find the submission
    submission = await repository.find_by_id(submission_id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found.")

    # Verify ownership via receipt_hash
    if submission.receipt_hash != body.receipt_hash:
        raise HTTPException(status_code=403, detail="Invalid receipt hash.")

    # Check 24-hour window
    today = datetime.now(UTC).date()
    if submission.submitted_date != today:
        raise HTTPException(
            status_code=410,
            detail="Withdrawal period expired. Submissions can only be withdrawn within 24 hours.",
        )

    # Only allow withdrawal of SUBMITTED status
    if submission.status.value != "submitted":
        raise HTTPException(
            status_code=409,
            detail="Cannot withdraw a submission that is already under review or resolved.",
        )

    # Delete
    deleted = await repository.delete_by_id(submission_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to withdraw submission.")

    return {"detail": "Submission withdrawn successfully."}
