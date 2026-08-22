"""API schemas — Pydantic models for request/response serialization."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field

from spill.core.entities.submission import Category, ImpactLevel, SubmissionStatus

# ─── Submission Endpoint Schemas ─────────────────────────────────────────────


class SubmitFeedbackRequest(BaseModel):
    """Request schema for submitting anonymous feedback."""

    category: Category
    impact: ImpactLevel
    encrypted_payload: str = Field(
        ..., min_length=1, description="Base64-encoded AES-256-GCM ciphertext"
    )
    encryption_iv: str = Field(
        ..., min_length=1, description="Base64-encoded initialization vector"
    )
    encrypted_symmetric_key: str = Field(
        ..., min_length=1, description="RSA-OAEP encrypted AES key (base64)"
    )
    receipt_hash: str = Field(
        ...,
        min_length=64,
        max_length=64,
        pattern=r"^[a-f0-9]{64}$",
        description="SHA-256 hex digest of ephemeral session token",
    )


class SubmitFeedbackResponse(BaseModel):
    """Response after successful submission."""

    submission_id: str
    status: SubmissionStatus
    submitted_date: date


# ─── Status Check Schemas ─────────────────────────────────────────────────────


class StatusCheckRequest(BaseModel):
    """Request schema for checking submission status."""

    receipt_hash: str = Field(
        ...,
        min_length=64,
        max_length=64,
        pattern=r"^[a-f0-9]{64}$",
        description="SHA-256 hex digest of ephemeral session token",
    )


class StatusItem(BaseModel):
    """Individual submission status in the response."""

    submission_id: str
    category: Category
    impact: ImpactLevel
    status: SubmissionStatus
    submitted_date: date
    status_note: str


class StatusCheckResponse(BaseModel):
    """Response containing all submissions for a session."""

    submissions: list[StatusItem]


# ─── Admin Schemas ────────────────────────────────────────────────────────────


class AdminSubmissionItem(BaseModel):
    """Submission detail for admin view (encrypted payload included)."""

    id: str
    category: Category
    impact: ImpactLevel
    encrypted_payload: str
    encryption_iv: str
    encrypted_symmetric_key: str
    status: SubmissionStatus
    submitted_date: date
    status_note: str


class AdminListResponse(BaseModel):
    """Paginated list of submissions for admin."""

    items: list[AdminSubmissionItem]
    total: int
    limit: int
    offset: int


class UpdateStatusRequest(BaseModel):
    """Request to update a submission's status."""

    status: SubmissionStatus
    note: str = ""


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "healthy"
    version: str
