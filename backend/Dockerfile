# Multi-stage image for the Notes backend.
#
# Targets:
#   dev   — uv + full dependency graph (incl. dev group), Django dev server.
#           Used by docker-compose.yml with a bind mount + hot reload.
#   prod  — slim runtime: only the resolved prod venv is copied in, no uv,
#           no dev tooling. Served by gunicorn. Used by docker-compose.prod.yml.

# --- Shared base -----------------------------------------------------------
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

WORKDIR /app

# --- Builder: resolve a production-only virtualenv -------------------------
# uv lives only in this stage; it never reaches the prod image.
FROM base AS builder

COPY --from=ghcr.io/astral-sh/uv:0.5.0 /uv /uvx /bin/

# Install dependencies first for better layer caching. --no-dev drops the
# entire dev group (pytest, mypy, ruff, stubs, pre-commit, ...).
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# --- Dev image -------------------------------------------------------------
# Keeps uv and the full dependency graph; source is bind-mounted at runtime.
FROM base AS dev

COPY --from=ghcr.io/astral-sh/uv:0.5.0 /uv /uvx /bin/

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

COPY . .

EXPOSE 8000

# Run migrations, then start the dev server.
CMD ["sh", "-c", "uv run python manage.py migrate && uv run python manage.py runserver 0.0.0.0:8000"]

# --- Prod image ------------------------------------------------------------
# Copies just the resolved venv from the builder — no uv, no dev deps.
FROM base AS prod

# Put the venv on PATH so `gunicorn` / `python` resolve without `uv run`.
ENV PATH="/app/.venv/bin:$PATH"

COPY --from=builder /app/.venv /app/.venv

COPY . .

EXPOSE 8000

# Collect static files, run migrations, then serve via gunicorn.
# DJANGO_SETTINGS_MODULE defaults to config.settings.local (set in config/wsgi.py);
# override via env for a real deployment (e.g. config.settings.production).
CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate && gunicorn config.wsgi --bind 0.0.0.0:8000 --workers 3"]
