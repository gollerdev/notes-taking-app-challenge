"""Abstract base model providing shared fields for all domain models."""

from __future__ import annotations

import uuid

from django.db import models


class BaseModel(models.Model):
    """Abstract base model with UUID primary key and audit timestamps.

    All domain models inherit from this class to ensure consistent
    primary-key strategy, timestamping, and soft-delete support.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        """Meta options for BaseModel."""

        abstract = True
