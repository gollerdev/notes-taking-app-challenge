"""Test settings.

Used by pytest. Still runs against PostgreSQL — never SQLite — so tests
exercise the same database engine as production. Password hashing is set
to a fast hasher to keep the suite quick.
"""

from .base import *  # noqa: F403

DEBUG = False

# Fast password hashing for tests only.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
