"""Integration tests for FastAPI routes and middleware."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from spill.adapters.api.app import create_app


@pytest.fixture
def app():
    """Create a test application instance."""
    return create_app()


@pytest.fixture
async def client(app):
    """Async HTTP client for testing API endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestHealthEndpoint:
    """Tests for the /health endpoint."""

    @pytest.mark.asyncio
    async def test_health_returns_200(self, client):
        """Health check returns 200 with version info."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestMetadataPurgingMiddleware:
    """Tests verifying the privacy middleware strips identifying headers."""

    @pytest.mark.asyncio
    async def test_strips_user_agent(self, client):
        """User-Agent header is stripped before reaching the route."""
        response = await client.get(
            "/health",
            headers={"User-Agent": "Mozilla/5.0 Secret Browser"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_strips_x_forwarded_for(self, client):
        """X-Forwarded-For header is stripped."""
        response = await client.get(
            "/health",
            headers={"X-Forwarded-For": "192.168.1.100"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_strips_x_real_ip(self, client):
        """X-Real-IP header is stripped."""
        response = await client.get(
            "/health",
            headers={"X-Real-IP": "10.0.0.1"},
        )
        assert response.status_code == 200


class TestSubmissionEndpoint:
    """Tests for the POST /api/v1/submissions endpoint."""

    @pytest.mark.asyncio
    async def test_submit_requires_all_fields(self, client):
        """Missing fields return 422 validation error."""
        response = await client.post(
            "/api/v1/submissions",
            json={"category": "idea"},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_submit_validates_receipt_hash_format(self, client):
        """Receipt hash must be 64 hex characters."""
        response = await client.post(
            "/api/v1/submissions",
            json={
                "category": "idea",
                "impact": "low",
                "encrypted_payload": "encrypted",
                "encryption_iv": "ivdata",
                "encrypted_symmetric_key": "keydata",
                "receipt_hash": "tooshort",
            },
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_submit_validates_category_enum(self, client):
        """Invalid category returns 422."""
        response = await client.post(
            "/api/v1/submissions",
            json={
                "category": "invalid_category",
                "impact": "low",
                "encrypted_payload": "encrypted",
                "encryption_iv": "ivdata",
                "encrypted_symmetric_key": "keydata",
                "receipt_hash": "a" * 64,
            },
        )
        assert response.status_code == 422


class TestStatusEndpoint:
    """Tests for the POST /api/v1/submissions/status endpoint."""

    @pytest.mark.asyncio
    async def test_status_requires_receipt_hash(self, client):
        """Missing receipt_hash returns 422."""
        response = await client.post(
            "/api/v1/submissions/status",
            json={},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_status_validates_hash_format(self, client):
        """Non-hex receipt hash returns 422."""
        response = await client.post(
            "/api/v1/submissions/status",
            json={"receipt_hash": "not-a-valid-hex-hash"},
        )
        assert response.status_code == 422
