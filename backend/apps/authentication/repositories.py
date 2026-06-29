"""Repository layer for user data access."""

from __future__ import annotations

from apps.authentication.models import User


class UserRepository:
    """Data-access layer for the User model.

    All ORM queries for user objects are encapsulated here so that
    the service layer never touches the ORM directly.
    """

    @staticmethod
    def create_user(email: str, password: str) -> User:
        """Create and persist a new user with a hashed password.

        Args:
            email: The user's email address.
            password: The plaintext password (will be hashed by the manager).

        Returns:
            The newly created User instance.

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

        return User.objects.create_user(email=email, password=password)

    @staticmethod
    def get_by_email(email: str) -> User | None:
        """Look up a user by email address.

        Args:
            email: The email address to search for.

        Returns:
            The matching User instance, or ``None`` if not found.

        Raises:
            TypeError: If ``email`` is not a string.
            ValueError: If ``email`` is empty.
        """
        if not isinstance(email, str):
            raise TypeError(f"email must be a str, got {type(email)}")
        if not email:
            raise ValueError("email must not be empty")

        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None
