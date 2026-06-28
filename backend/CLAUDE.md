# CLAUDE.md — Backend

## Package manager
Use `uv`. Never use `pip install` directly.
- Add dependencies: `uv add <package>`
- Run commands: `uv run <command>`

## Django conventions
- Apps live in `backend/apps/`
- Settings split: `settings/base.py`, `settings/local.py`, `settings/production.py`

## API
- Django REST Framework
- JWT auth via `djangorestframework-simplejwt`
- All endpoints under `/api/v1/`

## Database
PostgreSQL only. Never use SQLite in any environment.

## Test runner
pytest + pytest-django. Run with `uv run pytest`. All tests in `tests/` per app.

## Linter
ruff. Run with `uv run ruff check . --fix`. Must pass before DONE.

## Environment
python-decouple for env vars. Never hardcode secrets.
