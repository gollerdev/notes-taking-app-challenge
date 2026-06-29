from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import User


class AuthenticationIntegrationTest(TestCase):
    """End-to-end authentication flow -- no mocking of any layer.

    Exercises URL routing -> view -> serializer -> service -> repository
    -> ORM -> JWT issuance -> blacklist against the real test database.

    Logout is AllowAny; the refresh token alone is sufficient to blacklist.
    """

    def setUp(self):
        self.client = APIClient()
        self.register_url = "/api/v1/auth/register/"
        self.login_url = "/api/v1/auth/login/"
        self.refresh_url = "/api/v1/auth/refresh/"
        self.logout_url = "/api/v1/auth/logout/"

    def test_full_auth_flow(self):
        # 1. Register a new user -> 201 + tokens
        register_resp = self.client.post(
            self.register_url,
            {"email": "integration@example.com", "password": "securepass123"},
            format="json",
        )
        self.assertEqual(register_resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", register_resp.data)
        self.assertIn("refresh", register_resp.data)

        refresh_token = register_resp.data["refresh"]

        # 2. Logout with only the refresh token (no access token needed) -> 205
        # Proves AllowAny is active and the refresh token is sufficient to blacklist.
        logout_register_resp = self.client.post(
            self.logout_url,
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(logout_register_resp.status_code, status.HTTP_205_RESET_CONTENT)

        # Verify identity: the registered user exists and matches expectations.
        user = User.objects.get(email="integration@example.com")
        self.assertEqual(user.email, "integration@example.com")

        # 3. Login with the same credentials -> 200 + fresh tokens
        login_resp = self.client.post(
            self.login_url,
            {"email": "integration@example.com", "password": "securepass123"},
            format="json",
        )
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_resp.data)
        self.assertIn("refresh", login_resp.data)

        login_refresh = login_resp.data["refresh"]

        # 4. Refresh -> 200 + rotated pair; old refresh is blacklisted
        refresh_resp = self.client.post(
            self.refresh_url,
            {"refresh": login_refresh},
            format="json",
        )
        self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_resp.data)
        self.assertIn("refresh", refresh_resp.data)

        # Old refresh is now blacklisted -- a second attempt must fail
        second_refresh_resp = self.client.post(
            self.refresh_url,
            {"refresh": login_refresh},
            format="json",
        )
        self.assertEqual(second_refresh_resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # 5. Logout with a valid refresh -> 205; reuse fails
        new_refresh = refresh_resp.data["refresh"]

        logout_resp = self.client.post(
            self.logout_url,
            {"refresh": new_refresh},
            format="json",
        )
        self.assertEqual(logout_resp.status_code, status.HTTP_205_RESET_CONTENT)

        # Reusing the blacklisted refresh must fail
        reuse_resp = self.client.post(
            self.refresh_url,
            {"refresh": new_refresh},
            format="json",
        )
        self.assertEqual(reuse_resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_register_duplicate_email_returns_400(self):
        self.client.post(
            self.register_url,
            {"email": "dup@example.com", "password": "securepass123"},
            format="json",
        )

        response = self.client.post(
            self.register_url,
            {"email": "dup@example.com", "password": "securepass123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_email_returns_400(self):
        response = self.client.post(
            self.register_url,
            {"email": "notanemail", "password": "securepass123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_short_password_returns_400(self):
        response = self.client.post(
            self.register_url,
            {"email": "test@example.com", "password": "short"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_invalid_credentials_returns_401(self):
        response = self.client.post(
            self.login_url,
            {"email": "nobody@example.com", "password": "wrongpass123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_fields_returns_400(self):
        response = self.client.post(
            self.login_url,
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
