# Plan: Authentication Infrastructure (Issue #7)

## Context
This ticket builds the authentication layer for the Django REST backend (Issue #7): a custom email-login `User` model, the register/login/refresh/logout endpoints, JWT token issuance with rotation + blacklisting, and the global default-auth/permission wiring that makes every future endpoint protected by default. All later Notes endpoints depend on `request.user` being populated by JWT auth and on `Note.objects.filter(owner=request.user)` being safe — so this infrastructure must be correct and fully tested (100% coverage). This is a backend-only ticket; there is no UI work.

**Ambiguity / decisions noted:**
- The ticket's file tree omits `repositories.py`, yet it lists `tests/test_repositories.py` and states *"`AuthService.register()` calls `UserRepository.create_user()`"*. Per the layered architecture in `backend/CLAUDE.md` (View → Serializer → Service → Repository → ORM), a `repositories.py` with `UserRepository` **is required**. The plan includes it.
- **Factory location conflict.** The ticket puts `UserFactory` in `apps/authentication/tests/factories.py`; `backend/CLAUDE.md` says shared entities like `UserFactory` live in `apps/core/tests/factories.py` so other apps (Notes) can import them. Decision: create `UserFactory` in `apps/authentication/tests/factories.py` per the ticket, and have future apps import it from there. Document this choice in the PR so it can be revisited if Notes prefers a `core` location.

## Sources of truth to consult
- None. This is a backend infrastructure ticket with no designed UI — Figma and the product video are not relevant. The GitHub issue body is the authoritative spec.

## What already exists (skip these)
- **`backend/config/settings/base.py`** already has:
  - `REST_FRAMEWORK` with `DEFAULT_AUTHENTICATION_CLASSES = (JWTAuthentication,)` and `DEFAULT_PERMISSION_CLASSES = (IsAuthenticated,)` — **global protection is already in place**; do not duplicate it.
  - `rest_framework_simplejwt` in `THIRD_PARTY_APPS`, `drf_spectacular` configured, `AUTH_PASSWORD_VALIDATORS` configured (MinimumLength etc. — these drive the "password too short" 400).
  - `LOCAL_APPS = ["apps.core"]`.
- **`backend/config/urls.py`** routes `api/v1/` → `apps.core.urls` and exposes `api/schema/` + `api/docs/`.
- **`backend/pyproject.toml`** already declares `djangorestframework-simplejwt`, `factory-boy`, `faker`, `parameterized`, `pytest`, `pytest-django`, `pytest-cov`, `ruff`, `mypy`. **No new `uv add` is needed** — the ticket's `uv add djangorestframework-simplejwt` is already satisfied. (Verify, don't re-add.)
- `apps/core/` health app + its tests — leave untouched.

## Files to create / modify

### `backend/config/settings/base.py` (modify)
- Add `"apps.authentication"` to `LOCAL_APPS`.
- Add `"rest_framework_simplejwt.token_blacklist"` to `THIRD_PARTY_APPS` — **required** for `ROTATE_REFRESH_TOKENS` + `BLACKLIST_AFTER_ROTATION` and for the logout/blacklist flow to work. (This app ships migrations, so a migration run is needed.)
- Add `AUTH_USER_MODEL = "authentication.User"`.
- Add the `SIMPLE_JWT` settings dict exactly as the ticket specifies:
  - `ACCESS_TOKEN_LIFETIME = timedelta(minutes=15)`
  - `REFRESH_TOKEN_LIFETIME = timedelta(days=7)`
  - `ROTATE_REFRESH_TOKENS = True`
  - `BLACKLIST_AFTER_ROTATION = True`
  - `AUTH_HEADER_TYPES = ("Bearer",)`
  - (add `from datetime import timedelta` at top)
- Do **not** change `REST_FRAMEWORK` — defaults already enforce auth globally.

### `backend/apps/authentication/__init__.py` + `apps.py` (create)
- Standard Django app package. `AppConfig` with `name = "apps.authentication"`, `default_auto_field` per project default. Google-style module/class docstrings (ruff `D`).

### `backend/apps/authentication/models.py` (create)
- Custom `User(AbstractUser)`:
  - `email = models.EmailField(unique=True)`
  - `USERNAME_FIELD = "email"`
  - `REQUIRED_FIELDS = []`
  - Set `username` to non-required / nullable as needed so email is the sole login identifier (AbstractUser ships a required unique `username`; neutralize it — e.g. `username = None` with a custom manager, **or** keep it optional). Use a custom `UserManager` with `create_user`/`create_superuser` keyed on email since `USERNAME_FIELD` is email.
  - Passwords are **never** stored in plaintext — rely on Django's `set_password()` (PBKDF2). No custom hashing.
  - Google-style docstrings on the class and manager methods.
- Note: this model does **not** need to extend `core.BaseModel` (UUID/timestamps) — it extends `AbstractUser`. Follow the ticket's model definition verbatim.

### `backend/apps/authentication/migrations/` (create)
- Initial migration for the custom `User` model. Because `AUTH_USER_MODEL` is being introduced, this migration must exist before any `migrate` run. Generate via `uv run python manage.py makemigrations authentication`.

### `backend/apps/authentication/repositories.py` (create)
- `UserRepository` (static methods, ORM-only) per layered architecture:
  - `create_user(email: str, password: str) -> User` — calls the model manager's `create_user` (which calls `set_password`). This is the method `AuthService.register()` delegates to.
  - `get_by_email(email: str) -> User | None` — lookup used by login.
  - Parameter guards: raise `TypeError`/`ValueError` on invalid `email`/`password` types or empties, per `backend/CLAUDE.md` parameter-validation standard.
  - Google-style docstrings with Args/Returns/Raises.

### `backend/apps/authentication/serializers.py` (create)
- `RegisterSerializer`: fields `email` (EmailField, validates format → 400 on `"notanemail"`), `password` (CharField, `write_only`, runs Django password validators → 400 on `"short"`). Validates uniqueness of email (→ 400 on duplicate). Never calls the service or repository; only validates and exposes `validated_data`.
- `LoginSerializer`: fields `email`, `password` (both required → 400 on missing). Validation here is shape-only; credential checking happens in the service (so wrong creds → 401, not 400).
- Output shape for both flows is `{"access": ..., "refresh": ...}` — may be returned directly from the view rather than via a serializer.
- Google-style docstrings.

### `backend/apps/authentication/services.py` (create)
- `AuthService` (plain Python, no HTTP/ORM knowledge; calls `UserRepository` only):
  - `register(email, password) -> dict` — calls `UserRepository.create_user(...)` **and nothing else** on the repository, then issues a token pair via simplejwt `RefreshToken.for_user(user)` and returns `{"access", "refresh"}`. (Token issuance via simplejwt is allowed in the service — it is the "token logic" layer per `backend/CLAUDE.md`.)
  - `login(email, password) -> dict` — fetches the user via `UserRepository.get_by_email`, calls `user.check_password(password)`; on success issues and returns a token pair; on failure raises an auth error that the view maps to **401** (e.g. DRF `AuthenticationFailed`).
  - Parameter guards (TypeError/ValueError) on all public methods per the standard.
  - Google-style docstrings with Args/Returns/Raises.
  - Refresh and logout: prefer reusing simplejwt's built-in `TokenRefreshView` / blacklist mechanics (see views) rather than reimplementing token rotation by hand. If any logout logic is custom (e.g. `token.blacklist()`), place it in `AuthService.logout(refresh)`.

### `backend/apps/authentication/views.py` (create)
- `RegisterView` — `APIView`/`GenericAPIView`, `permission_classes = [AllowAny]`. Validates with `RegisterSerializer`, delegates to `AuthService.register`, returns **201** with `{"access","refresh"}`.
- `LoginView` — `permission_classes = [AllowAny]`. Validates with `LoginSerializer`, delegates to `AuthService.login`, returns **200** with token pair; invalid credentials → **401**; missing fields → **400**.
- `RefreshView` — exchange refresh for a new access token, rotating + blacklisting the old refresh. Reuse simplejwt's `TokenRefreshView` (with `ROTATE_REFRESH_TOKENS`/`BLACKLIST_AFTER_ROTATION` already set, it returns a new `{"access","refresh"}` and blacklists the old). `permission_classes = [AllowAny]`. Returns **200**.
- `LogoutView` — `permission_classes` may be `[AllowAny]` or `[IsAuthenticated]`; accepts `{"refresh": ...}`, blacklists that refresh token, returns **205** with empty body. On an already-blacklisted/invalid token, return an appropriate 4xx.
- Views contain **no business logic** beyond HTTP orchestration (validate → delegate → respond).
- Google-style docstrings.

**OpenAPI standards (drf-spectacular)** — applies to all four views, per [backend/CLAUDE.md](backend/CLAUDE.md#L199-L214):
- Every endpoint carries an explicit `@extend_schema` decorator — never rely on auto-inference alone, since these are `APIView`s without a `ModelViewSet`/serializer drf-spectacular can introspect.
- **Tag**: all four grouped under a single consistent tag — `"Authentication"`.
- **operation_id / summary**: stable, explicit per endpoint (`auth_register`, `auth_login`, `auth_refresh`, `auth_logout`) so generated client method names don't churn.
- **Request body**: declared via the corresponding serializer (`RegisterSerializer`, `LoginSerializer`) or an inline serializer for `refresh`/`logout` (`{"refresh": str}`).
- **Responses**: document **every** status code each endpoint returns, not just the happy path — e.g. register `201`/`400`, login `200`/`400`/`401`, refresh `200`/`401`, logout `205`/`400`. Use `OpenApiResponse` with the success token-pair shape (`{"access": str, "refresh": str}`) and an error shape for 4xx.
- **No schema warnings**: `uv run python manage.py spectacular --validate --fail-on-warn` must produce a clean schema with zero warnings for the auth endpoints.

### `backend/apps/authentication/urls.py` (create)
- Routes under the `auth/` prefix (mounted at `/api/v1/auth/` via root urlconf):
  - `POST register/` → `RegisterView`
  - `POST login/` → `LoginView`
  - `POST refresh/` → `RefreshView`
  - `POST logout/` → `LogoutView`
- Named URLs for reverse lookups in tests.

### `backend/config/urls.py` (modify)
- Add `path("api/v1/auth/", include("apps.authentication.urls"))` alongside the existing `api/v1/` core include.

### `backend/apps/authentication/tests/__init__.py` (create)

### `backend/apps/authentication/tests/factories.py` (create)
- `UserFactory(DjangoModelFactory)` per the ticket:
  - `Meta.model = "authentication.User"`
  - `email = factory.LazyFunction(fake.email)`
  - `password = factory.PostGenerationMethodCall("set_password", "testpass123")`
- Uses `faker` for randomized data per `backend/CLAUDE.md`.

### Testing strategy — unit vs integration
Two distinct test categories, both required:

- **Unit tests** (per-layer isolation, per [backend/CLAUDE.md](backend/CLAUDE.md#L509-L620)): each layer tested with the layer below it fully mocked. Views mock `AuthService`; services mock `UserRepository`; repositories use the real DB (they *are* the data layer — no mock below them). These verify the exact code path with strict call verification (correct args + nothing else called). Covers `test_views.py`, `test_services.py`, `test_repositories.py`.
- **Integration test** (end-to-end, **no mocks**): exercises the full real stack — URL routing → view → serializer → service → repository → ORM → JWT issuance → blacklist — against PostgreSQL. This is the highest-value test for this ticket because the whole purpose is `request.user` being correctly populated downstream. Lives in `tests/test_integration.py`.

### `backend/apps/authentication/tests/test_integration.py` (create)
- End-to-end flow with **no mocking of any layer**, using `APIClient` against the real test DB:
  1. `POST /api/v1/auth/register/` → 201, capture `{access, refresh}`.
  2. Call a **protected** endpoint with **no** `Authorization` header → **401** (proves global `IsAuthenticated` default is active).
  3. Call the same protected endpoint with `Authorization: Bearer <access>` → **200**, and assert the resolved `request.user` matches the registered account (proves the token maps to the right identity — the core downstream guarantee for Notes scoping).
  4. `POST /api/v1/auth/login/` with the same credentials → 200 + a fresh token pair.
  5. `POST /api/v1/auth/refresh/` with the refresh token → 200 + rotated pair; the **old** refresh now fails on a second refresh attempt (blacklisted).
  6. `POST /api/v1/auth/logout/` with a valid refresh → 205; reusing that refresh afterward fails (blacklisted).
- Use a minimal authenticated-only probe endpoint to assert 401-vs-200 (e.g. an existing protected route, or a tiny test-only `IsAuthenticated` view) — note which is used.

### `backend/apps/authentication/tests/test_views.py` (create)
- **Unit tests.** DRF `APIClient` tests; **mock the service layer** (`patch("apps.authentication.views.AuthService...")`) so views never hit the DB, per the view-layer testing strategy. (Real end-to-end coverage of `RefreshView`/`LogoutView` blacklist behavior lives in `test_integration.py`, so view-level tests here stay fully mocked rather than half-mocked.)
- Required cases (from the ticket):
  - Register → **201** + tokens on valid input.
  - Register → **400** on duplicate email.
  - Login → **200** + tokens on valid credentials.
  - Login → **401** on invalid credentials.
  - Refresh → returns a new token pair (and old refresh is blacklisted).
  - Logout → **205** and blacklists the refresh token.
  - `register` and `login` accept **unauthenticated** requests (`AllowAny`).
  - A protected sanity endpoint (e.g. the future-style check) returns **401** without a Bearer token — assert global `IsAuthenticated` is enforced (can target an authenticated-only test view or an existing protected route).
- Strict call verification: assert the service method was called with exact args and **no other** service method was called.

### `backend/apps/authentication/tests/test_services.py` (create)
- **Unit tests.** Plain `TestCase`; **mock `UserRepository`** (`patch("apps.authentication.services.UserRepository...")`).
- `AuthService.register()` calls `UserRepository.create_user()` and **nothing else** (strict call verification per `backend/CLAUDE.md`).
- `AuthService.login()` fetches the user, calls `check_password()`, and issues tokens on success / raises on failure.
- **Parameterized parameter-validation tests** for every public service method covering all invalid combinations from the ticket table:
  - `email`: `None`, `""`, `"notanemail"`, `123`
  - `password`: `None`, `""`, `"short"`
  - Use the sentinel pattern from `backend/CLAUDE.md` (resolve `"valid"` to a real value inside the test body — never instantiate factories in the decorator).

### `backend/apps/authentication/tests/test_repositories.py` (create)
- **Unit tests at the data layer** — real DB, no mocks (the repository is the lowest layer), using `UserFactory`/randomized data:
  - `create_user` persists a user, stores email, and hashes the password (`check_password` true, stored value ≠ plaintext).
  - `get_by_email` returns the matching user / `None` when absent.
  - Parameterized invalid-input tests for the repository's parameter guards (same email/password invalid matrix).

## Order of execution
1. **Settings + app registration**: add `apps.authentication` and `token_blacklist` to `INSTALLED_APPS`, add `AUTH_USER_MODEL`, add `SIMPLE_JWT`.
2. **Model + manager** (`models.py`), then `makemigrations authentication` and `migrate` (custom user model must migrate before anything uses it; `token_blacklist` migrations run here too).
3. **Repository** (`repositories.py`).
4. **Serializers** (`serializers.py`).
5. **Service** (`services.py`).
6. **Views** (`views.py`) + **app urls** (`urls.py`), then wire into `config/urls.py`.
7. **Factory + unit tests** (`tests/factories.py`, `test_repositories.py`, `test_services.py`, `test_views.py`).
8. **Integration test** (`tests/test_integration.py`) — full unmocked auth flow.
9. Run migrations, then the full test/lint/type suite; validate the OpenAPI schema documents all four endpoints with zero warnings.

## Verification
- [ ] `uv run python manage.py makemigrations --check` shows no missing migrations (auth + token_blacklist migrations committed).
- [ ] `uv run python manage.py migrate` succeeds against PostgreSQL with the custom `User` model and `token_blacklist` tables.
- [ ] `uv run pytest` passes with no failures.
- [ ] `uv run pytest --cov=apps --cov-fail-under=100` passes — **100% coverage** on views, services, and repositories.
- [ ] `uv run ruff check .` passes with no errors.
- [ ] `uv run ruff format --check .` passes.
- [ ] `uv run mypy .` passes with no errors.
- [ ] `POST /api/v1/auth/register/` → 201 + `{access, refresh}`; duplicate email → 400; invalid email → 400; short password → 400.
- [ ] `POST /api/v1/auth/login/` → 200 + tokens for valid creds; invalid creds → 401; missing fields → 400.
- [ ] `POST /api/v1/auth/refresh/` → 200 with a rotated token pair; old refresh is blacklisted.
- [ ] `POST /api/v1/auth/logout/` → 205 and blacklists the refresh token.
- [ ] A protected endpoint returns 401 without a valid Bearer token; `register`/`login` accept unauthenticated requests.
- [ ] **Unit tests** present for each layer with strict call verification (views mock service; services mock repository; repository hits real DB).
- [ ] **Integration test** present: full unmocked register → 401-without-token → 200-with-token (identity matches) → login → refresh (old refresh blacklisted) → logout (refresh blacklisted) flow passes against PostgreSQL.
- [ ] All parameterized parameter-validation tests pass (full email/password invalid matrix).
- [ ] OpenAPI schema (`/api/schema/`, `/api/docs/`) documents all four auth endpoints with request/response shapes, a single `Authentication` tag, explicit operation IDs, and **all** status codes per endpoint.
- [ ] `uv run python manage.py spectacular --validate --fail-on-warn` produces a clean schema with zero warnings.
- [ ] Passwords are never stored in plaintext (repository test asserts hashing); no hardcoded secrets.

## Out of scope
- Note / Category models, serializers, services, repositories, and endpoints (separate ticket) — including the `NoteViewSet.get_queryset()` user-scoping shown in the ticket as illustrative downstream usage.
- Any frontend auth work (login/register pages, `AuthContext`, token storage, `services/auth.ts`) — handled in the frontend auth ticket.
- Password reset, email verification, social login, refresh-token cookie storage, or rate limiting — none are in the ticket.
- CI pipeline changes and Docker changes beyond what already exists.
- Moving `UserFactory` to `core/tests/factories.py` (decision deferred to the Notes ticket if needed).
