"""Serializers for note request/response validation."""

from __future__ import annotations

from typing import Any

from rest_framework import serializers

from apps.notes.models import Note


class NoteSerializer(serializers.ModelSerializer[Note]):
    """Input/output contract for note CRUD operations.

    Validates incoming data and shapes outgoing responses. The ``id``,
    ``created_at``, and ``updated_at`` fields are read-only.
    """

    class Meta:
        """Meta options for NoteSerializer."""

        model = Note
        fields = ["id", "title", "body", "category", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_title(self, value: str) -> str:
        """Reject blank or whitespace-only titles.

        Args:
            value: The title string to validate.

        Returns:
            The stripped title if non-empty.

        Raises:
            serializers.ValidationError: If the title is blank or
                whitespace-only.
        """
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError("Title must not be blank.")
        return stripped


class NotePartialSerializer(NoteSerializer):
    """Serializer for PATCH requests where all fields are optional.

    Inherits field definitions from ``NoteSerializer`` but marks every
    writable field as non-required.
    """

    class Meta(NoteSerializer.Meta):
        """Meta options for NotePartialSerializer."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialise with all fields set to non-required.

        Args:
            *args: Positional arguments forwarded to the parent.
            **kwargs: Keyword arguments forwarded to the parent.
        """
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.required = False

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Reject PATCH requests that supply no writable fields.

        Args:
            attrs: The validated field values from the request body.

        Returns:
            The unchanged attrs dict if at least one field is present.

        Raises:
            serializers.ValidationError: If the request body is empty.
        """
        if not attrs:
            raise serializers.ValidationError("At least one field must be provided.")
        return attrs
