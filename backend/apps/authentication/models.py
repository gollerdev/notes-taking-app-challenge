"""User model with email-based authentication."""

from __future__ import annotations

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager["User"]):
    """Custom manager for email-based user creation.

    Overrides the default ``create_user`` and ``create_superuser``
    methods so that ``email`` is the sole required identifier — the
    ``username`` field is removed entirely.
    """

    def create_user(
        self,
        email: str | None = None,
        password: str | None = None,
        **extra_fields: object,
    ) -> User:
        """Create and persist a regular user.

        Args:
            email: The user's email address. Must be non-empty.
            password: The plaintext password (will be hashed).
            **extra_fields: Additional model field values.

        Returns:
            The newly created User instance.

        Raises:
            ValueError: If ``email`` is not provided.
        """
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str | None = None,
        password: str | None = None,
        **extra_fields: object,
    ) -> User:
        """Create and persist a superuser.

        Args:
            email: The superuser's email address.
            password: The plaintext password (will be hashed).
            **extra_fields: Additional model field values.

        Returns:
            The newly created superuser instance.

        Raises:
            ValueError: If ``is_staff`` or ``is_superuser`` is not True.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom user model using email as the sole login identifier.

    The ``username`` field from ``AbstractUser`` is removed entirely.
    Authentication is performed with ``email`` and ``password``.
    """

    username = None  # type: ignore[assignment]
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []  # type: ignore[misc]

    objects = UserManager()  # type: ignore[assignment,misc]

    class Meta:
        """Meta options for User."""

        db_table = "auth_user"

    def __str__(self) -> str:
        """Return the user's email as the string representation."""
        return self.email
