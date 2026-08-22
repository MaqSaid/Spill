"""Submissions router — anonymous feedback submission and status check endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from spill.adapters.api.dependencies import get_status_use_case, get_submit_use_case
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
