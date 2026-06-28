# Dev-oriented image for the Notes backend.
FROM python:3.12-slim

# Install uv (the only package manager used in this project).
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

WORKDIR /app

# Install dependencies first for better layer caching. Uses the locked
# dependency graph — never pip.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

# Copy the application source.
COPY . .

EXPOSE 8000

# Run migrations, then start the dev server. The container talks to the
# Postgres "db" service over the compose network.
CMD ["sh", "-c", "uv run python manage.py migrate && uv run python manage.py runserver 0.0.0.0:8000"]
