"""Tests for the core app views."""

from rest_framework import status


class TestHealthCheckView:
    """Tests for HealthCheckView."""

    def test_health_returns_200_and_status_ok(self, api_client):
        """GET /api/v1/health/ returns 200 with a status body."""
        response = api_client.get("/api/v1/health/")

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"status": "ok"}
