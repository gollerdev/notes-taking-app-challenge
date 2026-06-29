from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIClient
from rest_framework_simplejwt.exceptions import TokenError

from apps.authentication.tests.factories import UserFactory


class RegisterViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/auth/register/"

    @patch("apps.authentication.views.AuthService.register")
    def test_register_success_returns_201(self, mock_register: MagicMock):
        mock_register.return_value = {
            "access": "access_token",
            "refresh": "refresh_token",
        }

        response = self.client.post(
            self.url,
            {"email": "new@example.com", "password": "securepass123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["access"], "access_token")
        self.assertEqual(response.data["refresh"], "refresh_token")

    @patch("apps.authentication.views.AuthService.register")
    def test_register_calls_service_with_correct_args(self, mock_register: MagicMock):
        mock_register.return_value = {"access": "a", "refresh": "r"}

        self.client.post(
            self.url,
            {"email": "new@example.com", "password": "securepass123"},
            format="json",
        )

        mock_register.assert_called_once_with(
            email="new@example.com", password="securepass123"
        )

    @patch("apps.authentication.views.AuthService")
    def test_register_no_other_service_methods_called(self, mock_service: MagicMock):
        mock_service.register.return_value = {"access": "a", "refresh": "r"}

        self.client.post(
            self.url,
            {"email": "new@example.com", "password": "securepass123"},
            format="json",
        )

        called = [name for name, _, _ in mock_service.mock_calls]
        self.assertEqual(called, ["register"])

    def test_register_duplicate_email_returns_400(self):
        UserFactory(email="dup@example.com")

        response = self.client.post(
            self.url,
            {"email": "dup@example.com", "password": "securepass123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_email_returns_400(self):
        response = self.client.post(
            self.url,
            {"email": "notanemail", "password": "securepass123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_short_password_returns_400(self):
        response = self.client.post(
            self.url,
            {"email": "test@example.com", "password": "short"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_fields_returns_400(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_accepts_unauthenticated_requests(self):
        """AllowAny must be active on register — no 401/403 for anonymous."""
        response = self.client.post(
            self.url,
            {"email": "notanemail", "password": "short"},
            format="json",
        )
        self.assertNotIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )


class LoginViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/auth/login/"

    @patch("apps.authentication.views.AuthService.login")
    def test_login_success_returns_200(self, mock_login: MagicMock):
        mock_login.return_value = {
            "access": "access_token",
            "refresh": "refresh_token",
        }

        response = self.client.post(
            self.url,
            {"email": "user@example.com", "password": "pass12345"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["access"], "access_token")
        self.assertEqual(response.data["refresh"], "refresh_token")

    @patch("apps.authentication.views.AuthService.login")
    def test_login_calls_service_with_correct_args(self, mock_login: MagicMock):
        mock_login.return_value = {"access": "a", "refresh": "r"}

        self.client.post(
            self.url,
            {"email": "user@example.com", "password": "pass12345"},
            format="json",
        )

        mock_login.assert_called_once_with(
            email="user@example.com", password="pass12345"
        )

    @patch("apps.authentication.views.AuthService")
    def test_login_no_other_service_methods_called(self, mock_service: MagicMock):
        mock_service.login.return_value = {"access": "a", "refresh": "r"}

        self.client.post(
            self.url,
            {"email": "user@example.com", "password": "pass12345"},
            format="json",
        )

        called = [name for name, _, _ in mock_service.mock_calls]
        self.assertEqual(called, ["login"])

    @patch("apps.authentication.views.AuthService.login")
    def test_login_invalid_credentials_returns_401(self, mock_login: MagicMock):
        mock_login.side_effect = AuthenticationFailed("Invalid email or password.")

        response = self.client.post(
            self.url,
            {"email": "user@example.com", "password": "wrongpass"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_fields_returns_400(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.authentication.views.AuthService.login")
    def test_login_accepts_unauthenticated_requests(self, mock_login: MagicMock):
        """AllowAny must be active on login — no 401/403 for anonymous."""
        mock_login.return_value = {"access": "a", "refresh": "r"}

        response = self.client.post(
            self.url,
            {"email": "user@example.com", "password": "pass12345"},
            format="json",
        )
        self.assertNotIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )


class RefreshViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/auth/refresh/"

    @patch("apps.authentication.views.TokenRefreshView.post")
    def test_refresh_returns_200_with_tokens(self, mock_post: MagicMock):
        from rest_framework.response import Response

        mock_post.return_value = Response(
            {"access": "new_access", "refresh": "new_refresh"},
            status=status.HTTP_200_OK,
        )

        response = self.client.post(self.url, {"refresh": "old_refresh"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["access"], "new_access")
        self.assertEqual(response.data["refresh"], "new_refresh")


class LogoutViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/auth/logout/"

    @patch("apps.authentication.views.AuthService.logout")
    def test_logout_success_returns_205(self, mock_logout: MagicMock):
        response = self.client.post(self.url, {"refresh": "some-token"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
        mock_logout.assert_called_once_with(refresh="some-token")

    @patch("apps.authentication.views.AuthService.logout")
    def test_logout_invalid_token_returns_400(self, mock_logout: MagicMock):
        mock_logout.side_effect = TokenError("Token is invalid or expired")

        response = self.client.post(self.url, {"refresh": "bad-token"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.authentication.views.AuthService.logout")
    def test_logout_accepts_unauthenticated_requests(self, mock_logout: MagicMock):
        """AllowAny must be active on logout — no 401/403 for anonymous."""
        response = self.client.post(self.url, {"refresh": "some-token"}, format="json")
        self.assertNotIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    @patch("apps.authentication.views.AuthService")
    def test_logout_no_other_service_methods_called(self, mock_service: MagicMock):
        self.client.post(self.url, {"refresh": "some-token"}, format="json")

        called = [name for name, _, _ in mock_service.mock_calls]
        self.assertEqual(called, ["logout"])


class ProtectedEndpointTest(TestCase):
    def test_health_endpoint_accessible_without_auth(self):
        """Health is AllowAny — sanity check it's not affected."""
        client = APIClient()
        response = client.get("/api/v1/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
