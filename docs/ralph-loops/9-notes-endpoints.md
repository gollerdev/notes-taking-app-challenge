# Ralph Loop Log: Notes Endpoints (Issue #9)

## 2026-06-29

**Plan file:** `docs/plans/9-notes-endpoints.md`
**Iterations:** 2 (min: 2, max: 3) — both returned DONE

### What Claude did

**Iteration 1** — Full implementation of the notes endpoints:
- Created `BaseModel` in `apps/core/models.py` (abstract: UUID pk, timestamps, soft-delete)
- Created the `apps.notes` Django app (18 new files)
- `Category` enum (`random_thoughts`, `school`, `personal`) and `Note(BaseModel)` model
- `NoteRepository` with `get_by_user`, `create`, `update` — all with parameter guards, `is_deleted=False` filtering
- `NoteFilter` with `ChoiceFilter` for category validation (400 on invalid values)
- `NoteSerializer` and `NotePartialSerializer` with custom `validate_title` (rejects blank/whitespace)
- `NoteService` with `get_user_notes`, `create_note`, `partial_update` — all with parameter guards
- `NoteViewSet` restricted to GET/POST/PATCH with `@extend_schema` OpenAPI annotations, `Notes` tag, explicit operation IDs
- `DefaultRouter` URL wiring under `api/v1/`
- `NoteFactory` with faker randomized data, importing `UserFactory` from `apps.authentication.tests.factories`
- Unit tests: `test_repositories.py`, `test_services.py`, `test_serializers.py`, `test_views.py` with strict call verification
- Parameterized parameter-validation tests for services and repositories
- Modified `config/settings/base.py` (added `apps.notes`), `config/urls.py` (added notes URL include), `mypy.ini` (django_filters ignore)

**Iteration 2** — Verification pass with two small fixes:
- Added `*/tests/*` to coverage omit in `pyproject.toml` so test files don't affect coverage measurement
- Removed unused `# type: ignore[django-manager-missing]` from auth models (mypy `unused-ignore` error)
- All 139 tests passing, 100% coverage, all linters/type checkers clean

### Deviations from the plan
- Created `test_serializers.py` (not in the plan's file list) — serializer validation logic warranted its own test file for coverage
- Modified `pyproject.toml` coverage omit to exclude test files — needed to maintain 100% coverage threshold
- Fixed a pre-existing mypy issue in `apps/authentication/models.py` (unused type ignore comment)

### AC items that failed verification
- None — all acceptance criteria passed

### Lessons / surprises
- The `ChoiceFilter` from `django-filter` returns `empty queryset` rather than 400 by default for invalid values — needed validation in the filter or view to produce the 400 behavior specified in the ticket
- Test files themselves were being included in coverage measurement, requiring a `pyproject.toml` adjustment to exclude `*/tests/*`
- A mypy `unused-ignore` surfaced in the auth module after iteration 1's changes — cross-module side effects from type checking config changes
