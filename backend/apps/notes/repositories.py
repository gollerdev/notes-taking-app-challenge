"""Repository layer for note data access."""

from __future__ import annotations

from django.db.models import QuerySet

from apps.authentication.models import User
from apps.notes.models import Note


class NoteRepository:
    """Data-access layer for the Note model.

    All ORM queries for note objects are encapsulated here so that
    the service layer never touches the ORM directly.
    """

    @staticmethod
    def get_by_user(user: User) -> QuerySet[Note]:
        """Retrieve all active notes belonging to a user.

        Args:
            user: The authenticated user.

        Returns:
            A queryset of non-deleted notes ordered by updated_at descending.

        Raises:
            TypeError: If ``user`` is not a User instance.
            ValueError: If ``user`` is not a saved User (no pk).
        """
        if not isinstance(user, User):
            raise TypeError(f"user must be a User instance, got {type(user)}")
        if not user.pk:
            raise ValueError("user must be a saved, authenticated User")

        return Note.objects.filter(owner=user, is_deleted=False)

    @staticmethod
    def create(validated_data: dict[str, object], owner: User) -> Note:
        """Persist a new note.

        Args:
            validated_data: Cleaned data from the serializer.
            owner: The authenticated user who owns the note.

        Returns:
            The newly created Note instance.

        Raises:
            TypeError: If ``validated_data`` is not a dict or ``owner``
                is not a User.
            ValueError: If ``validated_data`` is empty or ``owner``
                is not saved.
        """
        if not isinstance(validated_data, dict):
            raise TypeError(
                f"validated_data must be a dict, got {type(validated_data)}"
            )
        if not validated_data:
            raise ValueError("validated_data must not be empty")
        if not isinstance(owner, User):
            raise TypeError(f"owner must be a User instance, got {type(owner)}")
        if not owner.pk:
            raise ValueError("owner must be a saved, authenticated User")

        return Note.objects.create(**validated_data, owner=owner)

    @staticmethod
    def update(note: Note, validated_data: dict[str, object]) -> Note:
        """Update only the provided fields on an existing note.

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

        for field, value in validated_data.items():
            setattr(note, field, value)
        note.save(update_fields=[*validated_data.keys(), "updated_at"])
        note.refresh_from_db()
        return note
