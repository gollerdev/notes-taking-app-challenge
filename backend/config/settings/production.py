"""Production settings.

Hardened configuration with debug disabled and secure transport
defaults. Host and CORS allowances are read strictly from the
environment. Missing required vars raise UndefinedValueError at startup.
"""

from decouple import config

from .base import *  # noqa: F403

DEBUG = False

# No default — raises UndefinedValueError at startup if unset.
ALLOWED_HOSTS: list[str] = config(  # type: ignore[no-redef]
    "ALLOWED_HOSTS",
    cast=lambda v: [h.strip() for h in v.split(",") if h.strip()],
)

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS: list[str] = config(
    "CORS_ALLOWED_ORIGINS",
    default="",
    cast=lambda v: [o.strip() for o in v.split(",") if o.strip()],
)

# Restrict to JSON-only; BrowsableAPIRenderer is dev-only.
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # type: ignore[name-defined,unused-ignore]  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
)

# Static files — collectstatic writes here; Caddy serves /static/ from this path.
STATIC_ROOT = BASE_DIR / "staticfiles"  # noqa: F405

# Security hardening.
# SSL redirect is handled by Caddy — Django must not redirect internally,
# otherwise healthchecks (plain HTTP on localhost:8000) would fail.
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
