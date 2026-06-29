"""Views for authentication endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenRefreshView

from apps.authentication.serializers import (
    LoginSerializer,
    LogoutRequestSerializer,
    RefreshRequestSerializer,
    RegisterSerializer,
    TokenPairSerializer,
)
from apps.authentication.services import AuthService


class RegisterView(APIView):
    """Handle user registration."""

    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(
        tags=["Authentication"],
        operation_id="auth_register",
        summary="Register a new user",
        request=RegisterSerializer,
        responses={
            201: OpenApiResponse(
                response=TokenPairSerializer,
                description="Registration successful — token pair returned.",
            ),
            400: OpenApiResponse(description="Validation error."),
        },
    )
    def post(self, request: Request) -> Response:
        """Register a new user and return a JWT token pair.

        Args:
            request: The incoming HTTP request with email and password.

        Returns:
            201 with access/refresh tokens on success, 400 on validation failure.
        """
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = AuthService.register(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        return Response(tokens, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Handle user login."""

    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(
        tags=["Authentication"],
        operation_id="auth_login",
        summary="Log in with email and password",
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(
                response=TokenPairSerializer,
                description="Login successful — token pair returned.",
            ),
            400: OpenApiResponse(description="Missing or invalid fields."),
            401: OpenApiResponse(description="Invalid credentials."),
        },
    )
    def post(self, request: Request) -> Response:
        """Authenticate a user and return a JWT token pair.

        Args:
            request: The incoming HTTP request with email and password.

        Returns:
            200 with tokens on success, 400 on validation error,
            401 on invalid credentials.
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            tokens = AuthService.login(
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
            )
        except AuthenticationFailed as exc:
            return Response(
                {"detail": str(exc.detail)},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(tokens, status=status.HTTP_200_OK)


class RefreshView(TokenRefreshView):
    """Exchange a refresh token for a new access/refresh pair.

    Delegates to simplejwt's ``TokenRefreshView`` which handles
    rotation and blacklisting based on the ``SIMPLE_JWT`` settings.
    """

    permission_classes = [AllowAny]  # type: ignore[assignment]
    authentication_classes: list[type] = []  # type: ignore[assignment]

    @extend_schema(
        tags=["Authentication"],
        operation_id="auth_refresh",
        summary="Refresh an access token",
        request=RefreshRequestSerializer,
        responses={
            200: OpenApiResponse(
                response=TokenPairSerializer,
                description="Token refresh successful — new pair returned.",
            ),
            401: OpenApiResponse(description="Invalid or expired refresh token."),
        },
    )
    def post(self, request: Request, *args: object, **kwargs: object) -> Response:
        """Refresh the token pair.

        Args:
            request: The incoming HTTP request with a refresh token.
            *args: Positional arguments forwarded to the parent.
            **kwargs: Keyword arguments forwarded to the parent.

        Returns:
            200 with a new token pair, or 401 if the refresh token
            is invalid or blacklisted.
        """
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    """Blacklist a refresh token to log out."""

    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(
        tags=["Authentication"],
        operation_id="auth_logout",
        summary="Log out (blacklist refresh token)",
        request=LogoutRequestSerializer,
        responses={
            205: OpenApiResponse(description="Logout successful."),
            400: OpenApiResponse(description="Invalid or already-blacklisted token."),
        },
    )
    def post(self, request: Request) -> Response:
        """Blacklist the provided refresh token.

        Args:
            request: The incoming HTTP request with a refresh token.

        Returns:
            205 on success, 400 if the token is invalid or already blacklisted.
        """
        serializer = LogoutRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            AuthService.logout(refresh=serializer.validated_data["refresh"])
        except TokenError:
            return Response(
                {"detail": "Token is invalid or already blacklisted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)
