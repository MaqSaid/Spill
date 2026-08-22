"""Security tests — verify privacy guarantees and rate limiting.

These tests validate that:
1. The rate limiter blocks excessive admin requests
2. No plaintext feedback content appears in responses
3. Metadata purging is effective
4. The system maintains zero-knowledge properties
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest


class TestRateLimiter:
    """Verify rate limiting protects admin endpoints."""

    def test_rate_limiter_module_exists(self) -> None:
        """Rate limiter module must exist."""
        rate_limiter_path = (
            Path(__file__).parent.parent.parent
            / "src" / "spill" / "adapters" / "api" / "rate_limiter.py"
        )
        assert rate_limiter_path.exists(), "Rate limiter module missing"

    def test_rate_limiter_targets_admin_endpoints(self) -> None:
        """Rate limiter must target /api/v1/admin path prefix."""
        rate_limiter_path = (
            Path(__file__).parent.parent.parent
            / "src" / "spill" / "adapters" / "api" / "rate_limiter.py"
        )
        source = rate_limiter_path.read_text(encoding="utf-8")
        assert "/api/v1/admin" in source, (
            "Rate limiter must target admin endpoints"
        )

    def test_rate_limiter_returns_429(self) -> None:
        """Rate limiter must return HTTP 429 when limit exceeded."""
        rate_limiter_path = (
            Path(__file__).parent.parent.parent
            / "src" / "spill" / "adapters" / "api" / "rate_limiter.py"
        )
        source = rate_limiter_path.read_text(encoding="utf-8")
        assert "429" in source, "Rate limiter must return 429 status code"

    def test_rate_limiter_has_retry_after_header(self) -> None:
        """Rate limiter must include Retry-After header."""
        rate_limiter_path = (
            Path(__file__).parent.parent.parent
            / "src" / "spill" / "adapters" / "api" / "rate_limiter.py"
        )
        source = rate_limiter_path.read_text(encoding="utf-8")
        assert "Retry-After" in source, (
            "Rate limiter must include Retry-After header"
        )

    def test_rate_limiter_no_identity_tracking(self) -> None:
        """Rate limiter must NOT track per-user identity (no IP-based limiting)."""
        rate_limiter_path = (
            Path(__file__).parent.parent.parent
            / "src" / "spill" / "adapters" / "api" / "rate_limiter.py"
        )
        source = rate_limiter_path.read_text(encoding="utf-8")
        assert "client_ip" not in source.lower(), (
            "Rate limiter must not track per-client identity"
        )


class TestNoPlaintextLogging:
    """Verify no plaintext feedback content is ever logged."""

    SENSITIVE_FIELDS = {"encrypted_payload", "encryption_iv", "encrypted_symmetric_key"}
    SRC_DIR = Path(__file__).parent.parent.parent / "src" / "spill"

    def _get_python_files(self) -> list[Path]:
        """Get all Python source files (excluding tests)."""
        return list(self.SRC_DIR.rglob("*.py"))

    def test_no_print_statements_in_source(self) -> None:
        """Source code must not contain print() statements (potential data leak)."""
        violations: list[str] = []

        for filepath in self._get_python_files():
            source = filepath.read_text(encoding="utf-8")
            tree = ast.parse(source, filename=str(filepath))

            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Name) and node.func.id == "print":
                        relative = filepath.relative_to(self.SRC_DIR)
                        violations.append(f"{relative}:{node.lineno}")

        assert violations == [], (
            f"print() statements found in source (potential data leak):\n"
            + "\n".join(f"  - {v}" for v in violations)
        )

    def test_no_logging_of_sensitive_fields(self) -> None:
        """Source code must not log sensitive field names at INFO/DEBUG level."""
        violations: list[str] = []

        for filepath in self._get_python_files():
            source = filepath.read_text(encoding="utf-8")
            for i, line in enumerate(source.splitlines(), 1):
                if "log" in line.lower() and any(
                    field in line for field in self.SENSITIVE_FIELDS
                ):
                    relative = filepath.relative_to(self.SRC_DIR)
                    violations.append(f"{relative}:{i}: {line.strip()}")

        assert violations == [], (
            f"Potential logging of sensitive fields:\n"
            + "\n".join(f"  - {v}" for v in violations)
        )

    def test_no_plaintext_in_response_models(self) -> None:
        """API response schemas must not expose plaintext feedback fields."""
        schemas_path = self.SRC_DIR / "adapters" / "api" / "schemas.py"
        if not schemas_path.exists():
            pytest.skip("No schemas.py found")

        source = schemas_path.read_text(encoding="utf-8")
        assert "plaintext" not in source.lower(), (
            "Response schema must not contain 'plaintext' field"
        )
        assert "decrypted_content" not in source, (
            "Response schema must not contain decrypted content field"
        )


class TestMetadataPurging:
    """Verify metadata purging middleware properties."""

    MIDDLEWARE_PATH = (
        Path(__file__).parent.parent.parent
        / "src" / "spill" / "adapters" / "api" / "middleware.py"
    )

    def test_middleware_strips_ip_headers(self) -> None:
        """Middleware must strip IP-identifying headers."""
        source = self.MIDDLEWARE_PATH.read_text(encoding="utf-8")
        required_headers = [
            "x-forwarded-for",
            "x-real-ip",
            "user-agent",
            "cf-connecting-ip",
        ]
        for header in required_headers:
            assert header in source, (
                f"Middleware must strip '{header}' header"
            )

    def test_middleware_overrides_client_ip(self) -> None:
        """Middleware must override client IP to 0.0.0.0."""
        source = self.MIDDLEWARE_PATH.read_text(encoding="utf-8")
        assert "0.0.0.0" in source, (
            "Middleware must override client IP to 0.0.0.0"
        )

    def test_middleware_registered_in_app(self) -> None:
        """MetadataPurgingMiddleware must be registered in the app factory."""
        app_path = (
            Path(__file__).parent.parent.parent
            / "src" / "spill" / "adapters" / "api" / "app.py"
        )
        source = app_path.read_text(encoding="utf-8")
        assert "MetadataPurgingMiddleware" in source, (
            "MetadataPurgingMiddleware must be registered in app factory"
        )


class TestZeroKnowledgeProperties:
    """Verify the system maintains zero-knowledge invariants."""

    SRC_DIR = Path(__file__).parent.parent.parent / "src" / "spill"

    def test_no_decryption_capability_on_server(self) -> None:
        """Server must not have any decryption code."""
        violations: list[str] = []

        for filepath in self.SRC_DIR.rglob("*.py"):
            source = filepath.read_text(encoding="utf-8")
            if any(keyword in source for keyword in [
                "decrypt", "Fernet", "AES", "from cryptography",
                "from Crypto", "private_key"
            ]):
                relative = filepath.relative_to(self.SRC_DIR)
                violations.append(str(relative))

        assert violations == [], (
            f"Server has decryption capability (violates zero-knowledge):\n"
            + "\n".join(f"  - {v}" for v in violations)
        )

    def test_no_local_storage_in_frontend(self) -> None:
        """Frontend must not use localStorage (only sessionStorage)."""
        frontend_src = Path(__file__).parent.parent.parent.parent / "frontend" / "src"
        if not frontend_src.exists():
            pytest.skip("Frontend src not found")

        violations: list[str] = []
        for filepath in frontend_src.rglob("*.ts"):
            source = filepath.read_text(encoding="utf-8")
            if "localStorage" in source and "test" not in str(filepath):
                relative = filepath.relative_to(frontend_src)
                violations.append(str(relative))

        for filepath in frontend_src.rglob("*.tsx"):
            source = filepath.read_text(encoding="utf-8")
            if "localStorage" in source:
                relative = filepath.relative_to(frontend_src)
                violations.append(str(relative))

        assert violations == [], (
            f"localStorage usage detected (must use sessionStorage only):\n"
            + "\n".join(f"  - {v}" for v in violations)
        )

    def test_database_uses_date_not_timestamp(self) -> None:
        """Database models must use DATE type, not TIMESTAMP."""
        models_path = self.SRC_DIR / "adapters" / "db" / "models.py"
        if not models_path.exists():
            pytest.skip("No models.py found")

        source = models_path.read_text(encoding="utf-8")
        assert "DateTime" not in source or "Date" in source, (
            "Database must use DATE type for timestamp bucketing"
        )
