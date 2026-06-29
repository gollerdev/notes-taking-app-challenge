from unittest.mock import MagicMock, patch

from django.test import TestCase
from parameterized import parameterized
from rest_framework.exceptions import AuthenticationFailed

from apps.authentication.services import AuthService
from apps.authentication.tests.factories import UserFactory


class AuthServiceRegisterTest(TestCase):
    @patch("apps.authentication.services.RefreshToken")
    @patch("apps.authentication.services.UserRepository")
    def test_delegates_to_repository_and_returns_tokens(
        self, mock_repo: MagicMock, mock_refresh_cls: MagicMock
    ):
        mock_user = UserFactory.build()
        mock_repo.create_user.return_value = mock_user

        mock_refresh = MagicMock()
        mock_refresh.__str__ = MagicMock(return_value="refresh_token")
        mock_refresh.access_token = "access_token"
        mock_refresh_cls.for_user.return_value = mock_refresh

        result = AuthService.register(email="test@example.com", password="pass12345")

        mock_repo.create_user.assert_called_once_with(
            email="test@example.com", password="pass12345"
        )
        self.assertEqual(result, {"access": "access_token", "refresh": "refresh_token"})

    @patch("apps.authentication.services.RefreshToken")
    @patch("apps.authentication.services.UserRepository")
    def test_no_other_repository_methods_called(
        self, mock_repo: MagicMock, mock_refresh_cls: MagicMock
    ):
        mock_repo.create_user.return_value = UserFactory.build()
        mock_refresh = MagicMock()
        mock_refresh.__str__ = MagicMock(return_value="r")
        mock_refresh.access_token = "a"
        mock_refresh_cls.for_user.return_value = mock_refresh

        AuthService.register(email="test@example.com", password="pass12345")

        all_calls = [name for name, _, _ in mock_repo.mock_calls]
        self.assertEqual(all_calls, ["create_user"])

    @parameterized.expand(
        [
            ("none_email", None, "valid", TypeError),
            ("empty_email", "", "valid", ValueError),
            ("int_email", 123, "valid", TypeError),
            ("none_password", "valid", None, TypeError),
            ("empty_password", "valid", "", ValueError),
            ("int_password", "valid", 123, TypeError),
        ]
    )
    def test_invalid_params_raise(self, _name, email, password, expected_exc):
        if email == "valid":
            email = "test@example.com"
        if password == "valid":
            password = "securepass123"
        with self.assertRaises(expected_exc):
            AuthService.register(email=email, password=password)


class AuthServiceLoginTest(TestCase):
    @patch("apps.authentication.services.RefreshToken")
    @patch("apps.authentication.services.UserRepository")
    def test_valid_credentials_return_tokens(
        self, mock_repo: MagicMock, mock_refresh_cls: MagicMock
    ):
        mock_user = MagicMock()
        mock_user.check_password.return_value = True
        mock_repo.get_by_email.return_value = mock_user

        mock_refresh = MagicMock()
        mock_refresh.__str__ = MagicMock(return_value="refresh_token")
        mock_refresh.access_token = "access_token"
        mock_refresh_cls.for_user.return_value = mock_refresh

        result = AuthService.login(email="test@example.com", password="pass12345")

        mock_repo.get_by_email.assert_called_once_with("test@example.com")
        mock_user.check_password.assert_called_once_with("pass12345")
        self.assertEqual(result, {"access": "access_token", "refresh": "refresh_token"})

    @patch("apps.authentication.services.UserRepository")
    def test_user_not_found_raises_auth_failed(self, mock_repo: MagicMock):
        mock_repo.get_by_email.return_value = None

        with self.assertRaises(AuthenticationFailed):
            AuthService.login(email="no@example.com", password="pass12345")

    @patch("apps.authentication.services.UserRepository")
    def test_wrong_password_raises_auth_failed(self, mock_repo: MagicMock):
        mock_user = MagicMock()
        mock_user.check_password.return_value = False
        mock_repo.get_by_email.return_value = mock_user

        with self.assertRaises(AuthenticationFailed):
            AuthService.login(email="test@example.com", password="wrongpass")

    @patch("apps.authentication.services.RefreshToken")
    @patch("apps.authentication.services.UserRepository")
    def test_no_other_repository_methods_called(
        self, mock_repo: MagicMock, mock_refresh_cls: MagicMock
    ):
        mock_user = MagicMock()
        mock_user.check_password.return_value = True
        mock_repo.get_by_email.return_value = mock_user

        mock_refresh = MagicMock()
        mock_refresh.__str__ = MagicMock(return_value="r")
        mock_refresh.access_token = "a"
        mock_refresh_cls.for_user.return_value = mock_refresh

        AuthService.login(email="test@example.com", password="pass12345")

        all_calls = [name for name, _, _ in mock_repo.method_calls]
        self.assertEqual(all_calls, ["get_by_email"])

    @parameterized.expand(
        [
            ("none_email", None, "valid", TypeError),
            ("empty_email", "", "valid", ValueError),
            ("int_email", 123, "valid", TypeError),
            ("none_password", "valid", None, TypeError),
            ("empty_password", "valid", "", ValueError),
            ("int_password", "valid", 123, TypeError),
        ]
    )
    def test_invalid_params_raise(self, _name, email, password, expected_exc):
        if email == "valid":
            email = "test@example.com"
        if password == "valid":
            password = "securepass123"
        with self.assertRaises(expected_exc):
            AuthService.login(email=email, password=password)


class AuthServiceLogoutTest(TestCase):
    @patch("apps.authentication.services.RefreshToken")
    def test_blacklists_refresh_token(self, mock_refresh_cls: MagicMock):
        mock_token = MagicMock()
        mock_refresh_cls.return_value = mock_token

        AuthService.logout(refresh="some-refresh-token")

        mock_refresh_cls.assert_called_once_with("some-refresh-token")
        mock_token.blacklist.assert_called_once()

    @parameterized.expand(
        [
            ("none_refresh", None, TypeError),
            ("empty_refresh", "", ValueError),
            ("int_refresh", 123, TypeError),
        ]
    )
    def test_invalid_params_raise(self, _name, refresh, expected_exc):
        with self.assertRaises(expected_exc):
            AuthService.logout(refresh=refresh)
