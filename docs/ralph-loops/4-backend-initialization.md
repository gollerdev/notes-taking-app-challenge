# Ralph Loop Log — Issue #4: Backend initialization

## Run 1

- **Date:** 2026-06-28
- **Plan file:** `docs/plans/4-backend-initialization.md`
- **Iterations:** 5 (`--min 5 --max 15`; stopped at the minimum — every iteration returned `DONE`)

### What Claude did
- **Iteration 1 (build):** Stood up the full Django REST backend scaffold under `backend/`:
  - `pyproject.toml` + generated `uv.lock` — runtime deps (django, djangorestframework, djangorestframework-simplejwt, django-filter, drf-spectacular, django-cors-headers, psycopg[binary], python-decouple) and dev deps (pytest, pytest-django, pytest-cov, factory-boy, faker, parameterized, ruff, mypy, django-stubs, djangorestframework-stubs, pre-commit). ruff/pytest/coverage tool config matching `backend/CLAUDE.md` (`--cov=apps --cov-fail-under=100`).
  - `manage.py`, `config/` package — settings split (`base/local/production/test`), `urls.py` (routes under `/api/v1/`, drf-spectacular schema + `/api/docs/`), `wsgi.py`, `asgi.py`. PostgreSQL-only via python-decouple; `DB_HOST` defaults to `db`. No SQLite in any module, including `test.py`.
  - `apps/core/` app — `HealthCheckView` (`GET /api/v1/health/` → 200 `{"status":"ok"}`, `AllowAny`), wired into `config/urls.py`.
  - `conftest.py` (root `api_client` APIClient fixture) + `apps/core/tests/test_views.py` integration test.
  - `.env.example`, `mypy.ini`, `.pre-commit-config.yaml`, `Dockerfile` (python:3.12-slim + uv, migrate then runserver), `docker-compose.yml` (postgres `db` with healthcheck + named volume; `web` gated on db health, port 8000, source bind-mount + anonymous `.venv` volume), `.dockerignore`.
- **Iterations 2–5 (independent re-verification):** Each fresh-context subagent re-ran the full verification suite (`manage.py check`, `migrate`, `pytest`, `ruff check`, `ruff format --check`, `mypy`) against a throwaway Postgres container, booted the Docker stack, and confirmed all acceptance criteria. No further source changes were needed — the scaffold was complete and conformant after iteration 1. Iterations focused on different angles: settings/JWT/spectacular config & Dockerfile details (iter 3), testing-standards conformance & stray-artifact hygiene (iter 4), final end-to-end confirmation (iter 5).

### Deviations from the plan
- Pinned `mypy<1.11` and `django-stubs[compatible-mypy]>=5.0,<5.1` because the latest mypy crashed the django-stubs plugin. (In-scope tooling adjustment to keep `mypy .` green.)
- `mypy.ini` and `.pre-commit-config.yaml` placed at the **backend package root** (next to `pyproject.toml`/`manage.py`) rather than the repo root. The plan/`backend/CLAUDE.md` say "project root"; for a Django project that is the `backend/` package root, and `mypy.ini` must sit next to `pyproject.toml` for `mypy .` to pick it up. mypy passing confirms the placement.
- Scaffold files were left **staged** (`git add`) by an intermediate iteration. No commit or push was made (out of scope for this plan).

### AC items that failed verification
- None. All 11 acceptance criteria passed with live evidence on every verifying iteration:
  - `manage.py check` ✓, `migrate` vs PostgreSQL ✓, `pytest` ✓ (1 test, 100% coverage), `ruff check` ✓, `ruff format --check` ✓, `mypy .` strict ✓, `GET /api/v1/health/` → 200 `{"status":"ok"}` ✓, no SQLite anywhere ✓, secrets via env / `.env` gitignored / `.env.example` committed ✓, `docker compose up` full-stack boot with healthcheck-gated web + migrations + live 200 ✓, conforms to `backend/CLAUDE.md` (not rewritten) ✓.

### Lessons / surprises
- **Local Postgres collisions:** Host port 5432 was occupied (host Postgres causing auth errors), so subagents used throwaway containers on alternate ports (5433/5544/55432) and a temporary `.env` for compose validation, torn down after each run. Final `git status` stayed clean of stray `.env`/`.coverage`/`.venv` (all gitignored).
- **Windows bind-mount vs Linux venv:** The source bind-mount let the first container write a root-owned `.venv/lib64` symlink into the host venv. Fixed by adding an anonymous `/app/.venv` volume in compose so the container venv stays isolated from the Windows host.
- **Latest mypy + django-stubs incompatibility** required a version pin (see deviations) — worth remembering for later backend tickets.
- The build converged in a single iteration; iterations 2–5 were pure re-verification that confirmed stability and surfaced no regressions — strong signal the scaffold is solid for the Auth/Notes tickets to build on.
- `backend/CLAUDE.md` shows as `M` in git from before this run (the stub was expanded into the finalized standards spec earlier); per plan rules it was treated as the authoritative spec and left untouched by every iteration.
