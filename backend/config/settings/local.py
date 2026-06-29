"""Local development settings.

Enables debug mode and developer-friendly defaults. Never used in
production.
"""

from .base import *  # noqa: F403

DEBUG = True

ALLOWED_HOSTS = ["*"]
