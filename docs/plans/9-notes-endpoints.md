# Plan: Notes Endpoints (Issue #9)

## Context
This ticket implements the Notes CRUD endpoints — the core resource of the app. All endpoints are user-scoped (a user can only ever see, create, or modify their own notes) and protected by the JWT middleware from Issue #7. The frontend autosaves on every keystroke (debounced), so PATCH is the primary write endpoint — there is no explicit save button and no PUT. This is a backend-only ticket; there is no UI work.

**Ambiguity / decisions noted:**
- **`BaseModel` does not exist yet.** The ticket's `Note(BaseModel)` requires `apps/core/models.py` with `BaseModel` (UUID `id`, `created_at`, `updated_at`, `is_deleted`) per `backend/CLAUDE.md`. This model must be created as part of this ticket since it is a prerequisite for `Note`. It is a shared concern living in `core`, consistent with the architecture docs.
- **No DELETE endpoint.** The ticket defines `GET`, `POST`, and `PATCH` only. The `is_deleted` field on `BaseModel` and `NoteRepository.soft_delete()` in `backend/CLAUDE.md` suggest soft-delete is planned, but no endpoint for it is in scope. The plan includes the `is_deleted` field (via `BaseModel`) and the `filter(is_deleted=False)` repository query, but no delete endpoint or view action.
- **`NoteFactory` imports `UserFactory` from `apps.authentication.tests.factories`** — per the decision in Issue #7, `UserFactory` lives there rather than in `core`.
- **Filter type:** The ticket shows `ChoiceFilter` in the code block but `backend/CLAUDE.md` shows `CharFilter` with `iexact`. Decision: use `ChoiceFilter` per the ticket — it validates against the enum and returns 400 on invalid values, which matches the specified error behavior. Note this in the PR.
- **No pagination.** The ticket does not mention pagination. The plan does not add it.

## Sources of truth to consult
- None. This is a backend infrastructure ticket with no designed UI — Figma and the product video are not relevant. The GitHub issue body is the authoritative spec.

## What already exists (skip these)
- **`backend/config/settings/base.py`** already has:
  - `django_filters` in `THIRD_PARTY_APPS` and `DjangoFilterBackend` in `DEFAULT_FILTER_BACKENDS`
  - `REST_FRAMEWORK` with `IsAuthenticated` default and `JWTAuthentication`
  - `AUTH_USER_MODEL = "authentication.User"`
- **`backend/pyproject.toml`** already declares `django-filter`, `factory-boy`, `faker`, `parameterized`, `pytest`, `pytest-cov`, `ruff`, `mypy` — no new `uv add` is needed
- **`backend/apps/authentication/`** — the full auth infrastructure including `UserFactory` in `tests/factories.py`
- **`backend/config/urls.py`** — routes `api/v1/` to `apps.core.urls` and `api/v1/auth/` to `apps.authentication.urls`
- `apps/core/` health app + its tests — leave untouched (except adding `models.py` for `BaseModel`)

## Files to create / modify

### `backend/apps/core/models.py` (create)
- `BaseModel(models.Model)` — abstract base model per `backend/CLAUDE.md`:
  - `id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`
  - `created_at = models.DateTimeField(auto_now_add=True)`
  - `updated_at = models.DateTimeField(auto_now=True)`
  - `is_deleted = models.BooleanField(default=False)`
  - `class Meta: abstract = True`
- Google-style class docstring.

### `backend/apps/notes/__init__.py` + `apps.py` (create)
- Standard Django app package. `AppConfig` with `name = "apps.notes"`, `default_auto_field` per project default. Google-style docstrings.

### `backend/apps/notes/models.py` (create)
- `Category(models.TextChoices)`:
  - `RANDOM_THOUGHTS = "random_thoughts", "Random Thoughts"`
  - `SCHOOL = "school", "School"`
  - `PERSONAL = "personal", "Personal"`
- `Note(BaseModel)`:
  - `owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notes")`
  - `title = models.CharField(max_length=255)`
  - `body = models.TextField(blank=True, default="")`
  - `category = models.CharField(max_length=50, choices=Category.choices, default=Category.PERSONAL)`
  - `class Meta: ordering = ["-updated_at"]`
- Google-style docstrings on both classes.

### `backend/apps/notes/migrations/` (create)
- Initial migration for `Note`. Generate via `uv run python manage.py makemigrations notes`.

### `backend/apps/notes/filters.py` (create)
- `NoteFilter(django_filters.FilterSet)`:
  - `category = django_filters.ChoiceFilter(choices=Category.choices, required=False)` — validates against the enum, returns 400 on invalid values
  - `class Meta: model = Note, fields = ["category"]`
- Google-style docstrings.

### `backend/apps/notes/repositories.py` (create)
- `NoteRepository` (static methods, ORM-only) per layered architecture:
  - `get_by_user(user) -> QuerySet[Note]` — `Note.objects.filter(owner=user, is_deleted=False)`
  - `create(validated_data: dict, owner: User) -> Note` — `Note.objects.create(**validated_data, owner=owner)`
  - `update(note: Note, validated_data: dict) -> Note` — updates only provided fields, saves, returns refreshed instance
  - Parameter guards: raise `TypeError`/`ValueError` on invalid types or empties per `backend/CLAUDE.md` parameter-validation standard.
  - Google-style docstrings with Args/Returns/Raises.

### `backend/apps/notes/serializers.py` (create)
- `NoteSerializer(serializers.ModelSerializer)`:
  - `Meta.model = Note`
  - `Meta.fields = ["id", "title", "body", "category", "created_at", "updated_at"]`
  - `Meta.read_only_fields = ["id", "created_at", "updated_at"]`
  - Validate `title`: required, non-blank, whitespace-only is invalid (custom `validate_title` that strips and checks)
  - Validate `category`: validated by `choices` on the model field (DRF handles this automatically)
- `NotePartialSerializer` — same as `NoteSerializer` but all fields optional (for PATCH). Or use `NoteSerializer` with `partial=True` in the view — whichever is cleaner. The ticket lists `NotePartialSerializer` in the file tree, so create it as a subclass or separate serializer that sets all fields as non-required.
- Google-style docstrings.

### `backend/apps/notes/services.py` (create)
- `NoteService` (plain Python, no HTTP/ORM knowledge; calls `NoteRepository` only):
  - `get_user_notes(user) -> QuerySet[Note]` — calls `NoteRepository.get_by_user(user)` and nothing else
  - `create_note(validated_data: dict, user: User) -> Note` — calls `NoteRepository.create(validated_data, owner=user)` and nothing else
  - `partial_update(note: Note, validated_data: dict) -> Note` — calls `NoteRepository.update(note, validated_data)` and nothing else
  - Parameter guards (TypeError/ValueError) on all public methods per the standard.
  - Google-style docstrings with Args/Returns/Raises.

### `backend/apps/notes/views.py` (create)
- `NoteViewSet(ModelViewSet)`:
  - `serializer_class = NoteSerializer`
  - `filterset_class = NoteFilter`
  - `http_method_names` — restrict to `GET`, `POST`, `PATCH` only (no PUT, no DELETE)
  - `get_queryset()` → `NoteService.get_user_notes(self.request.user)` (user-scoping)
  - `perform_create(serializer)` → `NoteService.create_note(serializer.validated_data, self.request.user)`
  - `perform_update(serializer)` → `NoteService.partial_update(self.get_object(), serializer.validated_data)` — the view uses `partial=True` for PATCH
  - `get_serializer_class()` → return `NotePartialSerializer` for PATCH actions if a separate serializer is used
  - All endpoints are protected by the global `IsAuthenticated` default — no `permission_classes` override needed
  - Cross-user access returns 404 because `get_queryset()` only returns the authenticated user's notes — DRF's `get_object()` will raise 404 if the note is not in the queryset
- **OpenAPI (`@extend_schema`)** — per `backend/CLAUDE.md`:
  - Tag: `"Notes"`
  - Explicit `operation_id` and `summary` per action (`notes_list`, `notes_create`, `notes_partial_update`)
  - Request/response bodies documented via the serializers
  - All status codes documented: `200`/`400`/`401` for list, `201`/`400`/`401` for create, `200`/`400`/`401`/`404` for partial update
  - `uv run python manage.py spectacular --validate --fail-on-warn` must produce zero warnings
- Google-style docstrings.

### `backend/apps/notes/urls.py` (create)
- Use DRF's `DefaultRouter` to wire `NoteViewSet`:
  - `router.register("notes", NoteViewSet, basename="note")`
  - `urlpatterns = router.urls`
- This produces `GET /notes/`, `POST /notes/`, `PATCH /notes/{id}/` when restricted by `http_method_names`.

### `backend/config/settings/base.py` (modify)
- Add `"apps.notes"` to `LOCAL_APPS`.

### `backend/config/urls.py` (modify)
- Add `path("api/v1/", include("apps.notes.urls"))` — the notes routes will live alongside the core health routes under `api/v1/`.

### `backend/apps/notes/tests/__init__.py` (create)

### `backend/apps/notes/tests/factories.py` (create)
- `NoteFactory(DjangoModelFactory)`:
  - `Meta.model = "notes.Note"`
  - `owner = factory.SubFactory("apps.authentication.tests.factories.UserFactory")` — import path avoids circular imports
  - `title = factory.LazyFunction(fake.sentence)`
  - `body = factory.LazyFunction(fake.paragraph)`
  - `category = factory.LazyFunction(lambda: fake.random_element(elements=[c.value for c in Category]))` — or use `Category.values`
  - `is_deleted = False`
- Uses `faker` for randomized data per `backend/CLAUDE.md`.

### `backend/apps/notes/tests/test_repositories.py` (create)
- **Unit tests at the data layer** — real DB, no mocks, using `NoteFactory`/`UserFactory` with randomized data:
  - `get_by_user` returns only non-deleted notes for the given user
  - `get_by_user` excludes notes from other users
  - `get_by_user` excludes soft-deleted notes
  - `create` persists correct field values and sets `owner`
  - `update` updates only provided fields, `updated_at` is refreshed
  - Parameterized invalid-input tests for parameter guards (invalid `user`, `validated_data` types/empties, invalid `note` type)

### `backend/apps/notes/tests/test_services.py` (create)
- **Unit tests.** Plain `TestCase`; **mock `NoteRepository`** (`patch("apps.notes.services.NoteRepository...")`).
  - `NoteService.get_user_notes()` calls `NoteRepository.get_by_user()` and nothing else (strict call verification)
  - `NoteService.create_note()` calls `NoteRepository.create()` and nothing else
  - `NoteService.partial_update()` calls `NoteRepository.update()` and nothing else
  - **Parameterized parameter-validation tests** for every public service method covering invalid combinations:
    - `user`: `None`, `"not a user"`, unsaved `User()`
    - `validated_data`: `None`, `"not a dict"`, `[]`, `{}`
    - `note`: `None`, `"not a note"`, wrong type
  - Use the sentinel pattern from `backend/CLAUDE.md` (resolve `"valid"` to a real value inside the test body).

### `backend/apps/notes/tests/test_views.py` (create)
- **Unit tests.** DRF `APIClient` tests; **mock the service layer** (`patch("apps.notes.views.NoteService...")`) so views never hit the DB.
- Required cases:
  - `GET /notes/` returns only the authenticated user's notes (200)
  - `GET /notes/?category=school` returns filtered notes (200)
  - `GET /notes/?category=invalid` returns 400
  - `POST /notes/` creates a note scoped to `request.user` (201)
  - `POST /notes/` with blank title returns 400
  - `POST /notes/` with invalid category returns 400
  - `PATCH /notes/{id}/` updates only the provided fields (200)
  - `PATCH /notes/{id}/` with another user's note ID returns 404
  - `PATCH /notes/{id}/` with blank/whitespace title returns 400
  - All endpoints return 401 without a valid Bearer token
  - PUT and DELETE return 405 (method not allowed)
- Strict call verification: assert the service method was called with exact args and no other service method was called.

### Integration test (optional but recommended)
- If time permits within the loop iterations, add `test_integration.py` with a full unmocked flow: register user → create note → list notes → filter by category → partial update → verify `updated_at` changed → verify cross-user isolation (second user can't see first user's notes). This is not explicitly required by the ticket's "Done When" but strengthens confidence.

## Order of execution
1. **`BaseModel`**: create `backend/apps/core/models.py` with the abstract base model (no migration needed — it's abstract).
2. **App registration**: add `"apps.notes"` to `LOCAL_APPS` in `backend/config/settings/base.py`.
3. **Model**: create `apps/notes/models.py` with `Category` and `Note(BaseModel)`, then `uv run python manage.py makemigrations notes` and `uv run python manage.py migrate`.
4. **Repository**: create `apps/notes/repositories.py`.
5. **Filter**: create `apps/notes/filters.py`.
6. **Serializers**: create `apps/notes/serializers.py`.
7. **Service**: create `apps/notes/services.py`.
8. **Views + URLs**: create `apps/notes/views.py` and `apps/notes/urls.py`, then wire into `config/urls.py`.
9. **Factory + unit tests**: create `tests/factories.py`, `test_repositories.py`, `test_services.py`, `test_views.py`.
10. Run the full test/lint/type suite; validate the OpenAPI schema.

## Verification
- [ ] `uv run python manage.py makemigrations --check` shows no missing migrations.
- [ ] `uv run python manage.py migrate` succeeds against PostgreSQL with the `Note` model.
- [ ] `uv run pytest` passes with no failures.
- [ ] `uv run pytest --cov=apps --cov-fail-under=100` passes — 100% coverage on views, services, and repositories.
- [ ] `uv run ruff check .` passes with no errors.
- [ ] `uv run ruff format --check .` passes.
- [ ] `uv run mypy .` passes with no errors.
- [ ] `GET /api/v1/notes/` returns only the authenticated user's notes (200); returns 401 without Bearer token.
- [ ] `GET /api/v1/notes/?category=school` returns only notes with that category; `?category=invalid` returns 400.
- [ ] `POST /api/v1/notes/` creates a note scoped to `request.user` (201); blank/whitespace title returns 400; invalid category returns 400.
- [ ] `PATCH /api/v1/notes/{id}/` partial-updates and refreshes `updated_at` (200); another user's note ID returns 404; blank/whitespace title returns 400.
- [ ] PUT and DELETE on `/api/v1/notes/` return 405.
- [ ] Cross-user note access returns 404 (not 403).
- [ ] Unit tests present for each layer with strict call verification (views mock service; services mock repository; repository hits real DB).
- [ ] All parameterized parameter-validation tests pass (full invalid-input matrix for services and repositories).
- [ ] OpenAPI schema documents all notes endpoints with `Notes` tag, explicit operation IDs, request/response shapes, and all status codes.
- [ ] `uv run python manage.py spectacular --validate --fail-on-warn` produces zero warnings.
- [ ] `is_deleted=False` filter is applied in `NoteRepository.get_by_user()` — soft-deleted notes are never returned.

## Out of scope
- DELETE endpoint / soft-delete view action — not in the ticket
- Pagination — not mentioned in the ticket
- AI summarization (`summarize_note`) — separate ticket
- Frontend autosave UI, note editor, note cards — separate frontend ticket
- `Note.objects.filter(owner=request.user)` in `NoteViewSet.get_queryset()` bypassing the service — must go through `NoteService` per layered architecture
- Moving `UserFactory` to `core/tests/factories.py` — deferred per Issue #7 decision
- Any changes to the authentication app
