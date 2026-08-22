"""Admin authentication service — pure domain logic for token + TOTP verification.

This module has ZERO framework imports (FastAPI, SQLAlchemy, etc.).
It implements the authentication logic per the admin-authentication steering file.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import time
from dataclasses import dataclass


@dataclass
class AuthAttemptState:
    """Tracks failed authentication attempts for lockout."""

    failed_count: int = 0
    locked_until: float = 0.0  # monotonic timestamp

    def is_locked(self) -> bool:
        """Check if account is currently locked out."""
        if self.failed_count < 5:
            return False
        return time.monotonic() < self.locked_until

    def record_failure(self, lockout_seconds: int = 900) -> None:
        """Record a failed attempt. Lock after max attempts."""
        self.failed_count += 1
        if self.failed_count >= 5:
            self.locked_until = time.monotonic() + lockout_seconds

    def reset(self) -> None:
        """Reset on successful authentication."""
        self.failed_count = 0
        self.locked_until = 0.0


@dataclass
class AdminSession:
    """Represents an active admin session."""

    session_hash: str  # SHA-256 of the session token
    created_at: float  # monotonic timestamp
    last_activity: float  # monotonic timestamp for idle timeout


class AdminAuthService:
    """
    Handles admin authentication with token + TOTP.

    Security properties:
    - Admin token compared via timing-safe HMAC comparison
    - TOTP validated with 1-step tolerance window
    - Sessions are time-limited (absolute + idle timeout)
    - Account locks after N failed attempts
    """

    def __init__(
        self,
        *,
        token_hash: str,
        totp_secret: str,
        session_ttl: int = 28800,
        idle_ttl: int = 1800,
        max_attempts: int = 5,
        lockout_seconds: int = 900,
    ) -> None:
        self._token_hash = token_hash
        self._totp_secret = totp_secret
        self._session_ttl = session_ttl
        self._idle_ttl = idle_ttl
        self._max_attempts = max_attempts
        self._lockout_seconds = lockout_seconds
        self._attempt_state = AuthAttemptState()
        self._sessions: dict[str, AdminSession] = {}

    def authenticate(self, token: str, totp_code: str) -> str | None:
        """
        Authenticate admin with token + TOTP code.

        Returns a session token string on success, None on failure.
        Never logs the token or TOTP code.
        """
        if self._attempt_state.is_locked():
            return None

        # Skip auth if not configured (development mode)
        if not self._token_hash or not self._totp_secret:
            # In dev mode without auth config, allow access
            return self._create_session()

        # Verify token (timing-safe comparison)
        provided_hash = hashlib.sha256(token.encode()).hexdigest()
        if not hmac.compare_digest(provided_hash, self._token_hash):
            self._attempt_state.record_failure(self._lockout_seconds)
            return None

        # Verify TOTP (with 1-step tolerance)
        if not self._verify_totp(totp_code):
            self._attempt_state.record_failure(self._lockout_seconds)
            return None

        # Success — reset attempts and create session
        self._attempt_state.reset()
        return self._create_session()

    def validate_session(self, session_token: str) -> bool:
        """Validate an active session token. Returns True if valid."""
        session_hash = hashlib.sha256(session_token.encode()).hexdigest()
        session = self._sessions.get(session_hash)

        if session is None:
            return False

        now = time.monotonic()

        # Check absolute timeout
        if now - session.created_at > self._session_ttl:
            del self._sessions[session_hash]
            return False

        # Check idle timeout
        if now - session.last_activity > self._idle_ttl:
            del self._sessions[session_hash]
            return False

        # Update last activity
        session.last_activity = now
        return True

    def invalidate_session(self, session_token: str) -> None:
        """Invalidate (logout) a session."""
        session_hash = hashlib.sha256(session_token.encode()).hexdigest()
        self._sessions.pop(session_hash, None)

    def invalidate_all_sessions(self) -> None:
        """Invalidate all sessions (emergency/rotation)."""
        self._sessions.clear()

    @property
    def is_locked(self) -> bool:
        """Check if admin account is locked."""
        return self._attempt_state.is_locked()

    @property
    def failed_attempts(self) -> int:
        """Number of consecutive failed attempts."""
        return self._attempt_state.failed_count

    def _create_session(self) -> str:
        """Create a new session and return the raw token."""
        raw_token = secrets.token_hex(32)
        session_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        now = time.monotonic()
        self._sessions[session_hash] = AdminSession(
            session_hash=session_hash,
            created_at=now,
            last_activity=now,
        )
        return raw_token

    def _verify_totp(self, code: str) -> bool:
        """Verify TOTP code with 1-step tolerance window."""
        import pyotp

        totp = pyotp.TOTP(self._totp_secret)
        return totp.verify(code, valid_window=1)
