"""Serializers for authentication request validation."""

from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.authentication.models import User


class RegisterSerializer(serializers.Serializer):  # type: ignore[type-arg]
    """Validates registration input (email + password).

    Ensures the email is well-formed and unique, and the password
    passes Django's built-in password validators. Never touches
    the service or repository layer — validation only.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value: str) -> str:
        """Reject duplicate email addresses.

        Args:
            value: The email to validate.

        Returns:
            The normalised email if unique.

        Raises:
            serializers.ValidationError: If the email is already taken.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value: str) -> str:
        """Run Django password validators.

        Args:
            value: The plaintext password.

        Returns:
            The password if it passes all validators.

        Raises:
            serializers.ValidationError: If the password is too weak.
        """
        validate_password(value)
        return value


class LoginSerializer(serializers.Serializer):  # type: ignore[type-arg]
    """Validates login input shape (email + password required).

    Credential checking is performed in the service layer, not here.
    """

    email = serializers.EmailField()
    password = serializers.CharField()


class RefreshRequestSerializer(serializers.Serializer):  # type: ignore[type-arg]
    """Validates refresh token request body."""

    refresh = serializers.CharField()


class LogoutRequestSerializer(serializers.Serializer):  # type: ignore[type-arg]
    """Validates logout request body."""

    refresh = serializers.CharField()


class TokenPairSerializer(serializers.Serializer):  # type: ignore[type-arg]
    """Output shape for token pair responses."""

    access = serializers.CharField()
    refresh = serializers.CharField()
