"""Domain events — signals emitted when important state changes occur.

Events are simple data carriers (frozen dataclasses) that represent
something that happened in the domain. They decouple the core from
side effects (audit logging, notifications, etc.).

IMPORTANT: Events NEVER contain encrypted content or sensitive tokens.
They carry only operational metadata.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True, slots=True)
class SubmissionCreated:
    """Emitted when a new anonymous submission is created."""

    submission_id: str
    category: str
    impact: str
    submitted_date: date


@dataclass(frozen=True, slots=True)
class StatusChanged:
    """Emitted when an admin changes a submission's status."""

    submission_id: str
    old_status: str
    new_status: str
    occurred_date: date


@dataclass(frozen=True, slots=True)
class SubmissionWithdrawn:
    """Emitted when an employee withdraws their submission."""

    submission_id: str
    occurred_date: date


@dataclass(frozen=True, slots=True)
class AdminAuthenticated:
    """Emitted on successful admin authentication (no tokens stored)."""

    occurred_date: date


@dataclass(frozen=True, slots=True)
class AuthenticationFailed:
    """Emitted on failed admin authentication attempt."""

    attempt_count: int
    occurred_date: date


@dataclass(frozen=True, slots=True)
class MaintenanceModeChanged:
    """Emitted when maintenance mode is toggled."""

    enabled: bool
    occurred_date: date
