# CLAUDE.md — Backend

## Architecture

### Overview

This project follows a **layered architecture** pattern for the Django REST backend, enforcing a strict separation of concerns across five layers. Each layer has one responsibility and communicates only with the layer directly below it.

```
Request → Filter → View → Serializer → Service → Repository → ORM → DB
```

---

### Folder Structure

```
backend/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── local.py
│   │   ├── production.py
│   │   └── test.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/
│   ├── core/                        # Shared utilities and base classes
│   │   ├── filters.py               # Base filter classes
│   │   ├── pagination.py
│   │   ├── permissions.py
│   │   ├── exceptions.py            # Custom exception handler
│   │   └── models.py                # Abstract base model (timestamps, uuid pk)
│   │
│   ├── authentication/
│   │   ├── views.py                 # Login, refresh, logout
│   │   ├── serializers.py
│   │   ├── services.py              # Token logic, blacklisting
│   │   ├── urls.py
│   │   └── tests/
│   │
│   └── notes/
│       ├── filters.py               # NoteFilter (django-filter)
│       ├── views.py                 # ViewSets only, no logic
│       ├── serializers.py           # Input/output contracts (DTOs)
│       ├── services.py              # Business logic
│       ├── repositories.py          # All ORM queries
│       ├── models.py
│       ├── urls.py
│       ├── permissions.py
│       ├── schemas.py               # drf-spectacular overrides
│       └── tests/
│           ├── test_views.py
│           ├── test_services.py
│           └── test_repositories.py
│
├── docs/
│   └── AI_PROCESS.md
│
├── pyproject.toml                   # Dependencies + tool config (uv, ruff, pytest, coverage)
├── uv.lock                          # Locked dependency graph (committed)
├── .env.example                     # Documented env template (real .env is gitignored)
├── manage.py
└── docker-compose.yml
```

> Dependencies are managed exclusively through `uv` — `pyproject.toml` + `uv.lock` are the single source of truth. There are no `requirements/*.txt` files.

---

### Layer Responsibilities

#### 1. Filters
Entry point for narrowing querysets based on query parameters. Filters have no knowledge of business rules — they only translate request params into WHERE clauses.

Currently the only supported filter parameter is `category` (optional). The `FilterSet` is structured to make adding new parameters straightforward in the future.

**Tool:** `django-filter`

```python
# notes/filters.py
class NoteFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category", lookup_expr="iexact", required=False)

    class Meta:
        model = Note
        fields = ["category"]
```

> `category` is optional — omitting it returns all notes. New filter parameters should be added here as requirements grow.

---

#### 2. Views (Controllers)
The traffic director. Receives HTTP requests, enforces permissions, delegates to services, and returns responses. **No business logic lives here.** If a view contains an `if` statement unrelated to HTTP, it belongs in the service layer.

**Tool:** `ModelViewSet` (DRF)

```python
# notes/views.py
class NoteViewSet(ModelViewSet):
    serializer_class = NoteSerializer
    filterset_class = NoteFilter

    def get_queryset(self):
        return NoteService.get_user_notes(self.request.user)

    def perform_create(self, serializer):
        NoteService.create_note(serializer.validated_data, self.request.user)
```

---

#### 3. Serializers (DTOs)
The contract layer — equivalent to DTOs in Java/NestJS. They validate incoming data and shape outgoing responses. They sit between the view and the service and **never write to the database directly.**

```python
# notes/serializers.py
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "body", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
```

> **Note:** DRF Serializers = DTO pattern. The distinction is that DRF serializers can call `.save()`, which we deliberately avoid — the service layer owns all writes.

---

#### 4. Services (Business Logic)
Plain Python classes with no HTTP or ORM knowledge. All business rules live here: orchestration, AI calls, conditional logic, side effects. Easy to unit test in isolation.

```python
# notes/services.py
class NoteService:
    @staticmethod
    def get_user_notes(user):
        return NoteRepository.get_by_user(user)

    @staticmethod
    def create_note(validated_data, user):
        return NoteRepository.create(validated_data, owner=user)

    @staticmethod
    def summarize_note(note):
        from .ai import summarize_with_llm
        return summarize_with_llm(note.body)
```

---

#### 5. Repository (Data Access)
Abstracts all ORM queries. The service asks *what* it wants; the repository knows *how* to get it. If the database engine or query strategy changes, only this layer is affected.

```python
# notes/repositories.py
class NoteRepository:
    @staticmethod
    def get_by_user(user):
        return Note.objects.filter(owner=user, is_deleted=False)

    @staticmethod
    def create(validated_data, owner):
        return Note.objects.create(**validated_data, owner=owner)

    @staticmethod
    def soft_delete(note):
        note.is_deleted = True
        note.save(update_fields=["is_deleted", "updated_at"])
```

---

#### 6. ORM & Base Model
Django models are the schema definition. All models extend `BaseModel` for consistent fields across the project.

```python
# core/models.py
class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True
```

---

### Authentication

> Implementation details are tracked in the authentication ticket (see the corresponding GitHub issue).

---

### OpenAPI

**Tool:** `drf-spectacular`

Auto-generates an OpenAPI 3.0 schema from ViewSets and Serializers. Swagger UI is available at `/api/docs/`.

```python
SPECTACULAR_SETTINGS = {
    "TITLE": "Notes API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}
```

Use `@extend_schema` decorators on custom actions to enrich the generated docs.

---

### Key Libraries

| Purpose | Package |
|---|---|
| REST framework | `djangorestframework` |
| JWT auth | `djangorestframework-simplejwt` |
| Filtering | `django-filter` |
| OpenAPI docs | `drf-spectacular` |
| Environment vars | `python-decouple` |
| CORS | `django-cors-headers` |

---

### Layer Communication Rules

- Views call **Services** only — never repositories or ORM directly
- Services call **Repositories** only — never ORM directly
- Repositories call **ORM** only
- Serializers are passed `validated_data` — they never call services or repositories
- Filters operate on querysets returned by services via `get_queryset()`

---

## Standards

### Overview

| Concern | Tool |
|---|---|
| Linting & formatting | `ruff` |
| Type checking | `mypy` |
| Docstring style | Google style (enforced via Ruff) |
| Pre-commit enforcement | `pre-commit` |
| Package management | `uv` |

---

### Ruff

Ruff replaces Flake8, Black, isort, and pyupgrade in a single tool. It enforces PEP8 and additional rules including docstring requirements.

**Install:**
```bash
uv add --dev ruff
```

**`pyproject.toml`** (Ruff config):
```toml
[tool.ruff]
target-version = "py312"
line-length = 88

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors (PEP8)
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "UP",  # pyupgrade
    "D",   # pydocstyle (docstrings)
    "N",   # pep8-naming
    "C90", # mccabe complexity
]
ignore = [
    "D100", # Missing docstring in public module (optional)
    "D104", # Missing docstring in public package
]

[tool.ruff.lint.pydocstyle]
convention = "google"

[tool.ruff.lint.per-file-ignores]
"*/tests/*" = ["D"] # Relax docstring rules in test files
"*/migrations/*" = ["E", "F", "D"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

**Run:**
```bash
uv run ruff check .       # Lint
uv run ruff format .      # Format
uv run ruff check --fix . # Auto-fix where possible
```

---

### mypy

Static type checker. All functions must be annotated — untyped code will fail CI.

**Install:**
```bash
uv add --dev mypy django-stubs djangorestframework-stubs
```

**`mypy.ini`** (place at project root):
```ini
[mypy]
python_version = 3.12
strict = true
warn_return_any = true
warn_unused_configs = true
ignore_missing_imports = false

plugins =
    mypy_django_plugin.main,
    mypy_drf_plugin.main

[mypy.plugins.django-stubs]
django_settings_module = "config.settings.local"

[mypy-*.migrations.*]
ignore_errors = true
```

---

### Docstrings — Google Style

All public classes, methods, and functions must have a docstring. Google style is enforced by Ruff rule `D`.

**Class:**
```python
class NoteService:
    """Service layer for note business logic.

    Handles all operations related to notes including creation,
    retrieval, soft deletion, and AI summarization.
    """
```

**Method:**
```python
@staticmethod
def create_note(validated_data: dict, user: User) -> Note:
    """Create a new note for the given user.

    Args:
        validated_data: Cleaned data from the NoteSerializer.
        user: The authenticated user who owns the note.

    Returns:
        The newly created Note instance.

    Raises:
        ValidationError: If the data fails repository-level constraints.
    """
    return NoteRepository.create(validated_data, owner=user)
```

**Repository method:**
```python
@staticmethod
def get_by_user(user: User) -> QuerySet[Note]:
    """Retrieve all active notes belonging to a user.

    Args:
        user: The authenticated user.

    Returns:
        A queryset of non-deleted notes ordered by updated_at descending.
    """
    return Note.objects.filter(owner=user, is_deleted=False)
```

> Docstrings are **not** required in test files or migrations (excluded via `pyproject.toml`).

---

### Pre-commit

Runs Ruff and mypy automatically before every commit. Nothing unformatted, unlinted, or untyped reaches the repo.

**Install:**
```bash
uv add --dev pre-commit
uv run pre-commit install
```

**`.pre-commit-config.yaml`** (place at project root):
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.4
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        additional_dependencies:
          - django-stubs
          - djangorestframework-stubs
```

**Run manually against all files:**
```bash
uv run pre-commit run --all-files
```

---

### uv Workflow Summary

```bash
uv add --dev ruff mypy django-stubs djangorestframework-stubs pre-commit

uv run ruff check .           # Lint
uv run ruff format .          # Format
uv run mypy .                 # Type check
uv run pre-commit run --all-files  # Run all hooks manually
```

---

### CI Enforcement

All of the above must pass in CI before any PR can be merged. Add this to your GitHub Actions workflow:

```yaml
- name: Lint
  run: uv run ruff check .

- name: Format check
  run: uv run ruff format --check .

- name: Type check
  run: uv run mypy .
```

---

## Testing Standards

### Philosophy

Every layer is tested in isolation. Dependencies are mocked at every layer boundary except the database layer, which uses real data. The goal is to verify not only that code produces correct output, but that it executes the exact intended code path — no more, no less.

---

### Coverage Requirements

- **100% line coverage is required** on all testable code
- Coverage is measured and enforced in CI — PRs that drop below 100% are blocked
- Excluded from coverage: migrations, `__init__.py`, settings files, `manage.py`

**`pyproject.toml` coverage config:**
```toml
[tool.pytest.ini_options]
addopts = "--cov=apps --cov-report=term-missing --cov-fail-under=100"

[tool.coverage.run]
omit = [
    "*/migrations/*",
    "*/settings/*",
    "manage.py",
    "*/__init__.py",
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
]
```

**CI addition:**
```yaml
- name: Lint
  run: uv run ruff check .

- name: Format check
  run: uv run ruff format --check .

- name: Type check
  run: uv run mypy .

- name: Tests
  run: uv run pytest --cov=apps --cov-fail-under=100
```

> All steps must pass with a **100% test pass rate** before a PR can be merged. A single failing test blocks the merge.

---

### Layer Testing Strategy

#### View Layer — Mock the Service
Views are tested via DRF's `APIClient`. The service is fully mocked — views must never reach the database.

```python
# notes/tests/test_views.py
from unittest.mock import MagicMock, patch
from rest_framework.test import APIClient
from django.test import TestCase

class NoteViewSetCreateTest(TestCase):
    """Tests for NoteViewSet.create."""

    def setUp(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    @patch("apps.notes.views.NoteService.create_note")
    def test_create_calls_service_with_correct_args(self, mock_create: MagicMock):
        """View must call NoteService.create_note and nothing else."""
        mock_create.return_value = NoteFactory.build()
        payload = {"title": "My Note", "body": "Some content"}

        self.client.post("/api/v1/notes/", payload, format="json")

        mock_create.assert_called_once_with(
            {"title": "My Note", "body": "Some content"},
            self.user,
        )

    @patch("apps.notes.views.NoteService.create_note")
    def test_no_other_service_methods_called(self, mock_create: MagicMock):
        """Only create_note may be called on this endpoint."""
        with patch("apps.notes.views.NoteService") as mock_service:
            self.client.post("/api/v1/notes/", {"title": "T", "body": "B"}, format="json")
            called = [m for m, _ in mock_service.method_calls]
            self.assertEqual(called, ["create_note"])
```

---

#### Service Layer — Mock the Repository
Services are tested as plain Python — no HTTP, no Django test client. The repository is fully mocked.

```python
# notes/tests/test_services.py
from unittest.mock import MagicMock, call, patch
from django.test import TestCase

class NoteServiceCreateTest(TestCase):
    """Tests for NoteService.create_note."""

    @patch("apps.notes.services.NoteRepository.create")
    def test_delegates_to_repository(self, mock_create: MagicMock):
        """Service must call NoteRepository.create with correct args."""
        user = UserFactory()
        data = {"title": "T", "body": "B"}
        mock_create.return_value = NoteFactory.build()

        NoteService.create_note(data, user)

        mock_create.assert_called_once_with(data, owner=user)

    @patch("apps.notes.services.NoteRepository.create")
    def test_no_other_repository_methods_called(self, mock_create: MagicMock):
        """Only NoteRepository.create may be called during note creation."""
        with patch("apps.notes.services.NoteRepository") as mock_repo:
            NoteService.create_note({"title": "T", "body": "B"}, UserFactory())
            called = [m for m, _ in mock_repo.method_calls]
            self.assertEqual(called, ["create"])
```

---

#### Repository Layer — Real Database, Real Data
No mocks. Factories generate randomized data via `factory_boy`. Tests write to and read from a real test database to confirm ORM queries work correctly.

**Why randomized data matters:** Fixed test data (e.g. `title="test"`) can silently mask bugs — a query that only works for that exact value will always pass. Randomized data generated by `faker` on every test run ensures the code works for any valid input, not just the one you happened to hardcode. If a test is brittle against random values, that brittleness is a bug worth finding.

Every model must have a companion factory. Factories live in `tests/factories.py` within their app. `UserFactory` and other shared entities live in `core/tests/factories.py` and are imported wherever needed.

```python
# notes/tests/test_repositories.py
from django.test import TestCase

class NoteRepositoryGetByUserTest(TestCase):
    """Tests for NoteRepository.get_by_user."""

    def test_returns_only_user_notes(self):
        """Must return notes belonging to the queried user only."""
        user = UserFactory()
        other_user = UserFactory()
        NoteFactory.create_batch(3, owner=user)
        NoteFactory.create_batch(2, owner=other_user)

        result = NoteRepository.get_by_user(user)

        self.assertEqual(result.count(), 3)
        self.assertTrue(all(n.owner == user for n in result))

    def test_excludes_soft_deleted_notes(self):
        """Soft-deleted notes must never be returned."""
        user = UserFactory()
        NoteFactory(owner=user, is_deleted=True)
        active = NoteFactory(owner=user, is_deleted=False)

        result = NoteRepository.get_by_user(user)

        self.assertQuerysetEqual(result, [active])
```

**Factory example using `factory_boy` with randomized values:**
```python
# notes/tests/factories.py
import factory
from factory.django import DjangoModelFactory
from faker import Faker

fake = Faker()

class UserFactory(DjangoModelFactory):
    """Generates a User with random but valid field values."""

    class Meta:
        model = "auth.User"

    username = factory.LazyFunction(fake.user_name)
    email = factory.LazyFunction(fake.email)
    password = factory.PostGenerationMethodCall("set_password", "testpass123")

class NoteFactory(DjangoModelFactory):
    """Generates a Note with random but valid field values."""

    class Meta:
        model = "notes.Note"

    owner = factory.SubFactory(UserFactory)
    title = factory.LazyFunction(fake.sentence)
    body = factory.LazyFunction(fake.paragraph)
    is_deleted = False
```

---

### Strict Call Verification

Every unit test must assert:
1. The expected method was called with the exact expected arguments (`assert_called_once_with`)
2. No other methods on the mocked dependency were called

```python
# Pattern for verifying nothing else was called
with patch("apps.notes.services.NoteRepository") as mock_repo:
    NoteService.get_user_notes(user)

    # Assert what WAS called
    mock_repo.get_by_user.assert_called_once_with(user)

    # Assert NOTHING ELSE was called
    all_calls = [name for name, _, _ in mock_repo.mock_calls]
    self.assertEqual(all_calls, ["get_by_user"])
```

---

### Parameter Validation & Testing

Every public method in the service and repository layers must validate its parameters explicitly and raise `ValueError` or `TypeError` on invalid input — never silently pass bad data to the next layer.

**Service method with parameter guards:**
```python
@staticmethod
def create_note(validated_data: dict, user: User) -> Note:
    """Create a new note for the given user.

    Args:
        validated_data: Cleaned data dict. Must be non-empty.
        user: Authenticated User instance. Must not be None.

    Raises:
        TypeError: If validated_data is not a dict or user is not a User.
        ValueError: If validated_data is empty or user is anonymous.
    """
    if not isinstance(validated_data, dict):
        raise TypeError(f"validated_data must be a dict, got {type(validated_data)}")
    if not validated_data:
        raise ValueError("validated_data must not be empty")
    if not isinstance(user, User):
        raise TypeError(f"user must be a User instance, got {type(user)}")
    if not user.pk:
        raise ValueError("user must be a saved, authenticated User")

    return NoteRepository.create(validated_data, owner=user)
```

**Parameterized tests covering all invalid combinations:**
```python
from parameterized import parameterized

class NoteServiceCreateParamValidationTest(TestCase):
    """Exhaustive parameter validation tests for NoteService.create_note."""

    # NOTE: "valid" is a sentinel resolved to a real UserFactory() inside the test
    # body. Never call UserFactory() in the decorator list — it executes at
    # collection time, before the test database exists.
    @parameterized.expand([
        ("none_data",         None,           "valid",       TypeError),
        ("string_data",       "not a dict",   "valid",       TypeError),
        ("list_data",         [],             "valid",       TypeError),
        ("empty_dict",        {},             "valid",       ValueError),
        ("none_user",         {"title": "T"}, None,          TypeError),
        ("string_user",       {"title": "T"}, "not a user",  TypeError),
        ("unsaved_user",      {"title": "T"}, User(),        ValueError),
    ])
    def test_invalid_params_raise(self, _name, data, user, expected_exc):
        """Every invalid parameter combination must raise the correct exception."""
        if user == "valid":
            user = UserFactory()
        with self.assertRaises(expected_exc):
            NoteService.create_note(data, user)
```

> Every new service method must have a corresponding parameterized validation test block covering **all combinations** of invalid inputs before it can be merged.

---

### Test File Conventions

- One test file per source file: `services.py` → `tests/test_services.py`
- One test class per method: `NoteService.create_note` → `NoteServiceCreateTest`
- Test method names describe the scenario: `test_returns_only_user_notes`, `test_excludes_soft_deleted`
- Parameterized test names describe the invalid input: `"none_data"`, `"empty_dict"`

---

### Required Test Libraries

```bash
uv add --dev pytest pytest-django pytest-cov factory-boy faker parameterized
```

| Library | Purpose |
|---|---|
| `pytest` | Test runner |
| `pytest-django` | Django integration for pytest |
| `pytest-cov` | Coverage measurement and enforcement |
| `factory-boy` | Model factories with randomized data |
| `faker` | Random realistic data generation |
| `parameterized` | Parameterized test expansion |

---

## Docker

The backend is containerized via Docker. All services are defined in `docker-compose.yml` and the application is expected to be run and deployed through Docker.
