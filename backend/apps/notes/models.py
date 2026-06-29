"""Note model and category choices."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class Category(models.TextChoices):
    """Enumeration of supported note categories."""

    RANDOM_THOUGHTS = "random_thoughts", "Random Thoughts"
    SCHOOL = "school", "School"
    PERSONAL = "personal", "Personal"


class Note(BaseModel):
    """A user-owned note with title, body, and category.

    Inherits UUID primary key, timestamps, and soft-delete flag
    from ``BaseModel``.
    """

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True, default="")
    category = models.CharField(
        max_length=50,
        choices=Category.choices,
        default=Category.PERSONAL,
    )

    class Meta:
        """Meta options for Note."""

        ordering = ["-updated_at"]

    def __str__(self) -> str:
        """Return the note title as the string representation."""
        return self.title
