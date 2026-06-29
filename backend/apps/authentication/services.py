"""Service layer for authentication business logic."""

from __future__ import annotations

from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.models import User
from apps.authentication.repositories import UserRepository


class AuthService:
    """Orchestrates authentication flows.

    Contains token issuance, credential verification, and logout
    (blacklist) logic. Delegates all ORM access to ``UserRepository``.
    """

    @staticmethod
    def register(email: str, password: str) -> dict[str, str]:
        """Register a new user and issue a JWT token pair.

        Args:
            email: The new user's email address.
            password: The plaintext password.

        Returns:
            A dict with ``access`` and ``refresh`` JWT strings.

        Raises:
            TypeError: If ``email`` or ``password`` is not a string.
            ValueError: If ``email`` or ``password`` is empty.
        """
        if not isinstance(email, str):
            raise TypeError(f"email must be a str, got {type(email)}")
        if not isinstance(password, str):
            raise TypeError(f"password must be a str, got {type(password)}")
        if not email:
            raise ValueError("email must not be empty")
        if not password:
            raise ValueError("password must not be empty")

        user = UserRepository.create_user(email=email, password=password)
        return AuthService._issue_tokens(user)

    @staticmethod
    def login(email: str, password: str) -> dict[str, str]:
        """Authenticate a user and issue a JWT token pair.

        Args:
            email: The user's email address.
            password: The plaintext password to verify.

        Returns:
            A dict with ``access`` and ``refresh`` JWT strings.

        Raises:
            TypeError: If ``email`` or ``password`` is not a string.
            ValueError: If ``email`` or ``password`` is empty.
            AuthenticationFailed: If the credentials are invalid.
        """
        if not isinstance(email, str):
            raise TypeError(f"email must be a str, got {type(email)}")
        if not isinstance(password, str):
            raise TypeError(f"password must be a str, got {type(password)}")
        if not email:
            raise ValueError("email must not be empty")
        if not password:
            raise ValueError("password must not be empty")

        user = UserRepository.get_by_email(email)
        if user is None or not user.check_password(password):
            raise AuthenticationFailed("Invalid email or password.")
        return AuthService._issue_tokens(user)

    @staticmethod
    def logout(refresh: str) -> None:
        """Blacklist the given refresh token.

        Args:
            refresh: The refresh token string to blacklist.

        Raises:
            TypeError: If ``refresh`` is not a string.
            ValueError: If ``refresh`` is empty.
            TokenError: If the token is invalid or already blacklisted.
        """
        if not isinstance(refresh, str):
            raise TypeError(f"refresh must be a str, got {type(refresh)}")
        if not refresh:
            raise ValueError("refresh must not be empty")

        token = RefreshToken(refresh)  # type: ignore[arg-type]
        token.blacklist()

    @staticmethod
    def _issue_tokens(user: User) -> dict[str, str]:
        """Issue a JWT access/refresh pair for the given user.

        Args:
            user: The authenticated user instance.

        Returns:
            A dict with ``access`` and ``refresh`` JWT strings.
        """
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
