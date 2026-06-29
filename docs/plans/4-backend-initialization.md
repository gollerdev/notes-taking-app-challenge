# Plan: Backend initialization (Issue #4)

## Context
The `backend/` directory currently holds only a placeholder and a stub `backend/CLAUDE.md`. This plan stands up the Django REST backend from scratch — a runnable, tested, lint-clean skeleton — and rewrites `backend/CLAUDE.md` into the full backend standards contract that every later ticket (Auth, Notes) will follow. No feature code (Note/Category/Auth models or endpoints) is built here; the only endpoint is a health check used to prove the stack works end-to-end.

## Sources of truth to consult
- None. This is a backend scaffold ticket with no UI — Figma and the product video are not relevant.

## What already exists (skip these)
- **`backend/CLAUDE.md` — already authored and finalized.** It is the complete backend
  standards contract (layered architecture, folder structure, libraries, lint/type/test
  standards). **Do not rewrite it** — it is the authoritative spec the scaffold must
  conform to. The scaffold's structure, libraries, settings split, and tooling config
  must match what this file describes. Re-read it before building.
- `README.md` — leave untouched.
- `.gitignore` — already covers `.env`, `.venv`, `__pycache__`. Verify `.env` is ignored; do not recreate.

## Files to create / modify

### `backend/pyproject.toml`
- The uv manifest. Per `backend/CLAUDE.md`, dependencies are added via `uv add` (never pip).
- Runtime deps (match the Key Libraries table in `backend/CLAUDE.md`): `django`,
  `djangorestframework`, `djangorestframework-simplejwt`, `django-filter`,
  `drf-spectacular`, `django-cors-headers`, `psycopg[binary]`, `python-decouple`.
- Dev deps: `pytest`, `pytest-django`, `pytest-cov`, `factory-boy`, `faker`,
  `parameterized`, `ruff`, `mypy`, `django-stubs`, `djangorestframework-stubs`,
  `pre-commit`.
- Tool config sections in `pyproject.toml` for `ruff`, `pytest`, and `coverage` exactly
  as specified in `backend/CLAUDE.md` (incl. `--cov-fail-under=100`). `mypy.ini` and
  `.pre-commit-config.yaml` live at the project root per the standards doc.
- `uv.lock` is generated and committed alongside it.

### `backend/manage.py`
- Standard Django entrypoint. Defaults `DJANGO_SETTINGS_MODULE` to the local settings module.

### `backend/config/` — Django project package
- `config/settings/` split per the ticket: `base.py`, `local.py`, `production.py`, `test.py`.
  - `base.py`: shared config — installed apps (DRF, simplejwt, project apps), DRF defaults, `/api/v1/` routing, database read from env via python-decouple, `SECRET_KEY` from env.
  - `local.py`: `DEBUG=True`, local dev tweaks.
  - `production.py`: `DEBUG=False`, hardened settings.
  - `test.py`: test-specific config — **still PostgreSQL** (never SQLite), per `backend/CLAUDE.md`.
- `config/urls.py`: root urlconf, includes app routes under `/api/v1/`.
- `config/wsgi.py`, `config/asgi.py`: standard.

### `backend/apps/` — apps package
- App conventions per `backend/CLAUDE.md`: apps live under `backend/apps/`, each app owns a `tests/` package (not a single `tests.py`).
- A `core` (or `health`) app containing the health-check endpoint.

### Health-check endpoint
- `GET /api/v1/health/` → `200` with a small JSON body (e.g. `{"status": "ok"}`).
- Implemented as a DRF view, registered in `config/urls.py` under `/api/v1/`.

### Health-check test + `backend/conftest.py`
- `backend/conftest.py`: root pytest fixtures (e.g. a DRF `APIClient` fixture).
- Test in the app's `tests/` package: hits `GET /api/v1/health/` via `APIClient` against the PostgreSQL test DB and asserts `200` + body. Run with `uv run pytest`.

### `backend/.env.example`
- Documented, committed template (the real `.env` stays gitignored — never created or read).
- Keys: `SECRET_KEY`, `DEBUG`, and PostgreSQL connection vars (name, user, password, host, port).
- DB host must default to the compose service name (e.g. `DB_HOST=db`) so the app
  resolves Postgres inside the Docker network out of the box.

### Docker (`backend/Dockerfile` + `backend/docker-compose.yml`)
The app must be runnable via Docker from moment one — `docker compose up` brings up the
full stack with no extra setup. Per `backend/CLAUDE.md`, `docker-compose.yml` is the
declared entrypoint for running the backend.
- `Dockerfile`: Python 3.12 base; install `uv`; install deps from `pyproject.toml` +
  `uv.lock` (no `pip`); run via `uv run`. Entry runs migrations then starts the dev
  server (e.g. `uv run python manage.py migrate && uv run python manage.py runserver 0.0.0.0:8000`).
- `docker-compose.yml`: two services —
  - `db`: official `postgres` image, credentials from env, named volume for persistence,
    a healthcheck so the web service waits until Postgres is ready.
  - `web`: builds the `Dockerfile`, loads `.env`, `depends_on` `db` (gated on its
    healthcheck), maps port `8000`, mounts the source for live reload in dev.
- No SQLite — the container talks to the `db` service over the compose network.

### `backend/CLAUDE.md` (already finalized — do NOT rewrite)
This file is already authored and is the authoritative standards contract for the whole
backend. It is **not** a deliverable of this ticket — it is the spec. Re-read it before
building; the scaffold below must conform to it, specifically:
- **Layered architecture**: `Request → Filter → View → Serializer → Service → Repository → ORM → DB`, with the stated layer-communication rules.
- **Folder structure**: `config/` project package + `apps/` (with `core/`, and later `authentication/`, `notes/`); per-app `tests/` package; no `requirements/` folder (uv only).
- **Key libraries**: DRF, simplejwt, django-filter, drf-spectacular, django-cors-headers, python-decouple.
- **Standards**: ruff (Google-style docstrings), mypy `strict = true`, pre-commit, uv.
- **Testing standards**: 100% coverage (CI-enforced), per-layer mock strategy, strict call verification, factory_boy + faker, parameterized param-validation tests.

## Order of execution
1. `backend/pyproject.toml` + `uv.lock` (deps & tooling) and `manage.py`.
2. `config/` package — settings split, urls, wsgi/asgi.
3. `backend/apps/` + the `core`/health app and the `/api/v1/health/` endpoint wired into `config/urls.py`.
4. `backend/.env.example`.
5. `backend/conftest.py` + the health-endpoint integration test.
6. `backend/Dockerfile` + `backend/docker-compose.yml` (db + web services).
7. Run migrations and the test/lint/type suite, then `docker compose up`, to verify conformance with `backend/CLAUDE.md`.

## Verification
- [ ] `uv run python manage.py check` passes.
- [ ] `uv run python manage.py migrate` succeeds against PostgreSQL.
- [ ] `uv run pytest` passes with no failures (health endpoint test green, hitting Postgres via `APIClient`).
- [ ] `uv run ruff check .` passes with no errors.
- [ ] `uv run mypy .` passes with no errors.
- [ ] `GET /api/v1/health/` returns `200` with the expected JSON body.
- [ ] No SQLite configured in any settings module, including `test.py`.
- [ ] No hardcoded secrets; `.env` is gitignored and `.env.example` is committed.
- [ ] `docker compose up` boots the full stack (db + web); the web service waits for Postgres, runs migrations, and serves the app.
- [ ] `GET /api/v1/health/` returns `200` against the running container.
- [ ] Scaffold structure, libraries, and tooling config conform to `backend/CLAUDE.md` (not rewritten).

## Out of scope
- Note / Category / Auth models, serializers, and endpoints (separate tickets).
- Frontend and CI pipelines.
- Production Docker hardening (multi-stage builds, gunicorn/ASGI server, non-root user) — this ticket delivers a working dev-oriented compose stack only.
- Any seed data beyond what the health-check test needs.
