"""Application settings — environment-based configuration."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    All sensitive values come from env vars — never hardcoded.
    """

    # Database
    database_url: str = "postgresql+asyncpg://spill:spill@localhost:5432/spill"

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Application
    debug: bool = False
    log_level: str = "INFO"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Maintenance / Kill Switch
    maintenance: bool = False
    submissions_enabled: bool = True

    # Organization Public Key (PEM format, set by admin)
    org_public_key: str = ""

    # Data Retention
    retention_days: int = 365

    # Database Pool
    pool_size: int = 10
    pool_max_overflow: int = 20

    # Admin Authentication
    admin_token_hash: str = ""  # SHA-256 hash of admin token
    admin_totp_secret: str = ""  # Base32-encoded TOTP secret
    admin_session_ttl: int = 28800  # 8 hours in seconds
    admin_idle_ttl: int = 1800  # 30 minutes in seconds
    admin_max_attempts: int = 5
    admin_lockout_seconds: int = 900  # 15 minutes

    model_config = {"env_prefix": "SPILL_", "env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
