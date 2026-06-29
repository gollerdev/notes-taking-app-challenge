"""Test settings.

Used by pytest in CI and local test runs. Still runs against PostgreSQL —
never SQLite — so tests exercise the same database engine as production.
CI supplies env vars via docker-compose.ci.yml; local runs supply them
via .env or the shell.
"""

from decouple import config

from .base import *  # noqa: F403

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="notes_test"),
        "USER": config("DB_USER", default="notes_user"),
        "PASSWORD": config("DB_PASSWORD", default="notes_password"),
        "HOST": config("DB_HOST", default="db"),
        "PORT": config("DB_PORT", default="5432"),
    }
}

# Fast password hashing for tests only.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
