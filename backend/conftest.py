"""Root pytest fixtures shared across the test suite."""

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client() -> APIClient:
    """Provide an unauthenticated DRF APIClient.

    Returns:
        A fresh APIClient instance for issuing test requests.
    """
    return APIClient()
