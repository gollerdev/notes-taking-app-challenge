"""Views for notes endpoints."""

from __future__ import annotations

from typing import Any

from django.db.models import QuerySet
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.viewsets import ModelViewSet

from apps.notes.filters import NoteFilter
from apps.notes.models import Note
from apps.notes.serializers import NotePartialSerializer, NoteSerializer
from apps.notes.services import NoteService


class NoteViewSet(ModelViewSet[Note]):
    """CRUD endpoints for notes (GET, POST, PATCH only).

    All endpoints are user-scoped — a user can only see, create,
    or modify their own notes. Cross-user access returns 404.
    """

    serializer_class = NoteSerializer
    filterset_class = NoteFilter
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self) -> QuerySet[Note]:
        """Return only the authenticated user's active notes.

        Returns:
            A queryset of non-deleted notes belonging to the request user.
        """
        if getattr(self, "swagger_fake_view", False):
            return Note.objects.none()  # pragma: no cover
        return NoteService.get_user_notes(self.request.user)  # type: ignore[arg-type]

    def get_serializer_class(
        self,
    ) -> type[NoteSerializer | NotePartialSerializer]:
        """Return the appropriate serializer for the current action.

        Returns:
            ``NotePartialSerializer`` for PATCH, ``NoteSerializer`` otherwise.
        """
        if self.action == "partial_update":
            return NotePartialSerializer
        return NoteSerializer

    def perform_create(self, serializer: BaseSerializer[Note]) -> None:
        """Delegate note creation to the service layer.

        Args:
            serializer: The validated serializer instance.
        """
        serializer.instance = NoteService.create_note(
            serializer.validated_data,
            self.request.user,  # type: ignore[arg-type]
        )

    def perform_update(self, serializer: BaseSerializer[Note]) -> None:
        """Delegate partial update to the service layer.

        Args:
            serializer: The validated serializer instance.
        """
        NoteService.partial_update(serializer.instance, serializer.validated_data)  # type: ignore[arg-type]

    @extend_schema(
        tags=["Notes"],
        operation_id="notes_list",
        summary="List authenticated user's notes",
        responses={
            200: NoteSerializer(many=True),
            400: OpenApiResponse(description="Invalid filter parameter."),
            401: OpenApiResponse(description="Authentication required."),
        },
    )
    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """List all notes for the authenticated user.

        Args:
            request: The incoming HTTP request.
            *args: Positional arguments forwarded to the parent.
            **kwargs: Keyword arguments forwarded to the parent.

        Returns:
            A response with a list of serialized notes.
        """
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["Notes"],
        operation_id="notes_create",
        summary="Create a new note",
        request=NoteSerializer,
        responses={
            201: NoteSerializer,
            400: OpenApiResponse(description="Validation error."),
            401: OpenApiResponse(description="Authentication required."),
        },
    )
    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Create a note scoped to the authenticated user.

        Args:
            request: The incoming HTTP request.
            *args: Positional arguments forwarded to the parent.
            **kwargs: Keyword arguments forwarded to the parent.

        Returns:
            A response with the serialized note and HTTP 201.
        """
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=["Notes"],
        operation_id="notes_partial_update",
        summary="Partially update a note",
        request=NotePartialSerializer,
        responses={
            200: NoteSerializer,
            400: OpenApiResponse(description="Validation error."),
            401: OpenApiResponse(description="Authentication required."),
            404: OpenApiResponse(description="Note not found."),
        },
    )
    def partial_update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Partially update a note owned by the authenticated user.

        Args:
            request: The incoming HTTP request.
            *args: Positional arguments forwarded to the parent.
            **kwargs: Keyword arguments forwarded to the parent.

        Returns:
            A response with the updated serialized note.
        """
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["Notes"],
        operation_id="notes_retrieve",
        summary="Retrieve a single note",
        responses={
            200: NoteSerializer,
            401: OpenApiResponse(description="Authentication required."),
            404: OpenApiResponse(description="Note not found."),
        },
    )
    def retrieve(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Retrieve a single note owned by the authenticated user.

        Args:
            request: The incoming HTTP request.
            *args: Positional arguments forwarded to the parent.
            **kwargs: Keyword arguments forwarded to the parent.

        Returns:
            A response with the serialized note.
        """
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Block full PUT updates.

        Args:
            request: The incoming HTTP request.
            *args: Positional arguments forwarded to the parent.
            **kwargs: Keyword arguments forwarded to the parent.

        Returns:
            Never — this method should not be reachable.
        """
        return super().update(request, *args, **kwargs)  # pragma: no cover

    @extend_schema(exclude=True)
    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Block DELETE requests.

        Args:
            request: The incoming HTTP request.
            *args: Positional arguments forwarded to the parent.
            **kwargs: Keyword arguments forwarded to the parent.

        Returns:
            Never — this method should not be reachable.
        """
        return super().destroy(request, *args, **kwargs)  # pragma: no cover
