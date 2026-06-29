"""Service layer for note business logic."""

from __future__ import annotations

from django.db.models import QuerySet

from apps.authentication.models import User
from apps.notes.models import Note
from apps.notes.repositories import NoteRepository


class NoteService:
    """Orchestrates note operations.

    Contains all business logic related to notes. Delegates
    data access to ``NoteRepository``.
    """

    @staticmethod
    def get_user_notes(user: User) -> QuerySet[Note]:
        """Retrieve all active notes for the given user.

        Args:
            user: The authenticated user.

        Returns:
            A queryset of non-deleted notes belonging to the user.

        Raises:
            TypeError: If ``user`` is not a User instance.
            ValueError: If ``user`` is not a saved User.
        """
        if not isinstance(user, User):
            raise TypeError(f"user must be a User instance, got {type(user)}")
        if not user.pk:
            raise ValueError("user must be a saved, authenticated User")

        return NoteRepository.get_by_user(user)

    @staticmethod
    def create_note(validated_data: dict[str, object], user: User) -> Note:
        """Create a new note for the given user.

        Args:
            validated_data: Cleaned data from the NoteSerializer.
            user: The authenticated user who owns the note.

        Returns:
            The newly created Note instance.

        Raises:
            TypeError: If ``validated_data`` is not a dict or ``user``
                is not a User.
            ValueError: If ``validated_data`` is empty or ``user``
                is not saved.
        """
        if not isinstance(validated_data, dict):
            raise TypeError(
                f"validated_data must be a dict, got {type(validated_data)}"
            )
        if not validated_data:
            raise ValueError("validated_data must not be empty")
        if not isinstance(user, User):
            raise TypeError(f"user must be a User instance, got {type(user)}")
        if not user.pk:
            raise ValueError("user must be a saved, authenticated User")

        return NoteRepository.create(validated_data, owner=user)

    @staticmethod
    def partial_update(note: Note, validated_data: dict[str, object]) -> Note:
        """Partially update an existing note.

        Args:
            note: The Note instance to update.
            validated_data: Dict of field names to new values.

        Returns:
            The refreshed Note instance.

        Raises:
            TypeError: If ``note`` is not a Note or ``validated_data``
                is not a dict.
            ValueError: If ``validated_data`` is empty.
        """
        if not isinstance(note, Note):
            raise TypeError(f"note must be a Note instance, got {type(note)}")
        if not isinstance(validated_data, dict):
            raise TypeError(
                f"validated_data must be a dict, got {type(validated_data)}"
            )
        if not validated_data:
            raise ValueError("validated_data must not be empty")

        return NoteRepository.update(note, validated_data)
