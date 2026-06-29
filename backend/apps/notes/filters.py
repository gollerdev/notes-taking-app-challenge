"""Filters for narrowing note querysets by query parameters."""

from __future__ import annotations

import django_filters

from apps.notes.models import Category, Note


class NoteFilter(django_filters.FilterSet):  # type: ignore[misc]
    """Filter notes by category.

    Validates against the ``Category`` enum — invalid values
    return a 400 response.
    """

    category = django_filters.ChoiceFilter(
        choices=Category.choices,
        required=False,
    )

    class Meta:
        """Meta options for NoteFilter."""

        model = Note
        fields = ["category"]
