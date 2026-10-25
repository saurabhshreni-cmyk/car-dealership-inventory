# Lotline — Car Dealership Inventory System

A full-stack inventory app for a car dealership: browse and search vehicles, buy a unit (atomically — two buyers can never take the last car), and let admins add, edit, restock and delete stock.

- **Backend:** FastAPI · SQLAlchemy 2 · PostgreSQL · JWT auth · pytest
- **Frontend:** React · Vite · Tailwind · Vitest · React Testing Library
- **Built test-first:** every behaviour has a `test:` (red) commit followed by a `feat:` (green) commit. See `git log`.

![Dashboard (admin view)](docs/screenshots/admin-desktop.png)

## Architecture

```mermaid
flowchart LR
    subgraph Browser
        SPA["React SPA<br/>(Vite + Tailwind)"]
    end
    subgraph API["FastAPI backend"]
        R["Routes<br/>(thin: validate + delegate)"]
        S["Services<br/>(business rules)"]
        Repo["Repositories<br/>(all SQL lives here)"]
        R --> S --> Repo
    end
    DB[("PostgreSQL")]
    SPA -- "JSON + Bearer JWT" --> R
    Repo -- "SQLAlchemy 2" --> DB
```

| Layer | Responsibility | Example |
|---|---|---|
| `routes/` | Parse input, authorise (JWT, admin), return a response. No logic. | `routes/vehicles.py` |
| `services/` | Business rules and orchestration; raise domain errors. | `InventoryService.purchase` |
| `repositories/` | The only code that talks to the database. | `PurchaseRepository.purchase_one` |
| `schemas/` | Pydantic request/response models and validation. | `VehicleCreate` |
| `error_handlers.py` | Maps domain errors (`OutOfStockError`…) to HTTP codes. | 409 / 404 / 401 |

**Atomic purchase.** Buying runs one statement,
`UPDATE vehicles SET quantity = quantity - 1 WHERE id = :id AND quantity > 0 RETURNING …`,
and inserts the purchase row in the same transaction. If no row was updated the vehicle is either missing (404) or sold out (409). `tests/test_purchase_concurrency.py` fires 25 concurrent buyers at 5 units and asserts exactly 5 succeed and stock ends at 0. (I also temporarily swapped in a naive read-then-write version to confirm that test fails against it — it does, with a CHECK-constraint violation.)

## Screenshots

Captured from the running app with Playwright (`playwright-core` driving Microsoft Edge), at desktop (1360×900) and mobile (390×844) widths.

| View | Desktop | Mobile |
|---|---|---|
| Login | ![Login](docs/screenshots/login-desktop.png) | ![Login](docs/screenshots/login-mobile.png) |
| Dashboard | ![Dashboard](docs/screenshots/dashboard-desktop.png) | ![Dashboard](docs/screenshots/dashboard-mobile.png) |
| Search results | ![Search](docs/screenshots/search-desktop.png) | ![Search](docs/screenshots/search-mobile.png) |
| Sold-out vehicle | ![Sold out](docs/screenshots/soldout-desktop.png) | ![Sold out](docs/screenshots/soldout-mobile.png) |
| My purchases | ![My purchases](docs/screenshots/purchases-desktop.png) | ![My purchases](docs/screenshots/purchases-mobile.png) |
| Admin dashboard | ![Admin](docs/screenshots/admin-desktop.png) | ![Admin](docs/screenshots/admin-mobile.png) |
| Admin: add vehicle | ![Add vehicle](docs/screenshots/admin-dialog-desktop.png) | ![Add vehicle](docs/screenshots/admin-dialog-mobile.png) |

## Setup and run

### Option A — Docker (whole stack)

```bash
cp .env.example .env        # then set JWT_SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, POSTGRES_PASSWORD
docker compose up --build
```

- App: http://localhost:5173 · API docs: http://localhost:8000/docs
- The backend container seeds the admin account (from `ADMIN_EMAIL` / `ADMIN_PASSWORD`) and demo vehicles on start; the seed is idempotent.
- If port 5432 is taken on your machine set `POSTGRES_PORT=5433` in `.env`.
- Stop and wipe data: `docker compose down -v`.

### Option B — local development

```bash
# 1. database (optional — the default DATABASE_URL is a local SQLite file)
cp .env.example .env                # the db container reads POSTGRES_* from this root .env
docker compose up -d db

# 2. backend
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp ../.env.example .env             # edit values; switch DATABASE_URL to the Postgres line if you started the db
python -m app.seed                  # creates the admin + demo vehicles
uvicorn app.main:app --reload       # http://localhost:8000/docs

# 3. frontend (new terminal)
cd frontend
npm install
npm run dev                         # http://localhost:5173
```

### Running the tests

```bash
cd backend  && pytest                       # unit + API + concurrency, with coverage
cd frontend && npm test                     # vitest
cd frontend && npm run coverage             # vitest with coverage
# backend against real PostgreSQL:
TEST_DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/dealership_test pytest
```

### Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | SQLAlchemy URL. `postgres://` / `postgresql://` are rewritten to the psycopg driver. Default: SQLite file. |
| `TEST_DATABASE_URL` | pytest | Run the suite on Postgres instead of a temp SQLite file. |
| `JWT_SECRET_KEY` | backend | **Required.** Long random string. |
| `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES` | backend | Defaults `HS256`, `60`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | seed script | The admin account is created/promoted from these. |
| `CORS_ORIGINS` | backend | Comma-separated allowed origins (the frontend URL). |
| `POSTGRES_USER/PASSWORD/DB/PORT` | docker compose | Database container settings. |
| `VITE_API_BASE_URL` | frontend | API origin, baked in at build time. |

Secrets only ever come from the environment; `.env` is git-ignored and `.env.example` holds placeholders.

## API summary

All `/api/vehicles*` and `/api/purchases*` routes need `Authorization: Bearer <token>`.

| Method & path | Access | Description |
|---|---|---|
| `POST /api/auth/register` | public | Create a **normal user** (a `role` in the body is ignored). 409 if the email exists. |
| `POST /api/auth/login` | public | `{access_token, token_type, user}`. Same 401 for unknown email and wrong password. |
| `GET /api/vehicles` | user | All vehicles. |
| `GET /api/vehicles/search` | user | Filters: `make`, `model` (partial, case-insensitive), `category` (case-insensitive exact), `min_price`, `max_price`. Registered before `/{id}` routes. |
| `POST /api/vehicles` | **admin** | Create. |
| `PUT /api/vehicles/{id}` | **admin** | Replace make/model/category/price/quantity. |
| `DELETE /api/vehicles/{id}` | **admin** | Delete (purchase history is kept). |
| `POST /api/vehicles/{id}/purchase` | user | Buy one unit. 201 receipt · 404 unknown · 409 out of stock. |
| `POST /api/vehicles/{id}/restock` | **admin** | `{"amount": n}`, positive integer. |
| `GET /api/purchases/me` | user | The caller's purchases, newest first. |

Status codes: 401 missing/invalid token, 403 not an admin, 404 unknown vehicle, 409 conflict, 422 validation.

## Assumptions

I made these calls without asking, as requested:

1. **Database.** The app talks to PostgreSQL through `DATABASE_URL`. Because the brief allowed it, the *default* for quick local dev and for the test-suite is a SQLite **file** (never in-memory). The suite was also run against real PostgreSQL 16 in Docker (see the test report) and the full stack was run under Docker Compose.
2. **Admins** exist only through the seed script (`python -m app.seed`, from `ADMIN_EMAIL`/`ADMIN_PASSWORD`). If that email already registered as a normal user, the seed promotes it. Roles are read from the database on every request, not trusted from the token.
3. **Login response** includes the user object, so there is no `/api/auth/me`. The SPA stores `{token, user}` in `localStorage`; the server stays the authority on permissions.
4. **No migration tool.** Tables are created with `create_all` at startup / seed. Alembic would be the next step before changing a deployed schema.
5. **Purchase = one unit per request.** A `Purchase` row snapshots make, model and price, so the history survives a vehicle being edited or deleted (`vehicle_id` becomes `NULL` on delete).
6. **Money** is `NUMERIC(12,2)` in the database and serialised as a JSON number; fine for display, but a payments system should use integer cents.
7. **`PUT` is a full replacement** (all five fields required). Quantity can be set there as well as via `restock`.
8. **Search** is `LIKE`-based with `%`, `_` and `\` treated literally. `min_price > max_price` is a 422. No pagination (the lot is small).
9. **Passwords** are bcrypt-hashed, 8–72 **bytes** when UTF-8 encoded (bcrypt's input limit; multi-byte passwords are rejected with 422 rather than crashing). Emails are lower-cased; reserved domains such as `.test` are rejected by the email validator.
10. **Numeric limits.** Quantity and restock amount are capped at 1,000,000 and vehicle ids must be 1–2,147,483,647, so nothing can overflow a 32-bit `INTEGER` column on PostgreSQL (out-of-range input is a 422, not a 500). Access tokens must carry `exp` and `sub`.
11. **Frontend.** Category chips are derived from the inventory; text filters are debounced (350 ms) and use the search endpoint. Admin tools are inline on the dashboard rather than a separate page. Design direction: a warm "dealer's ledger" look (paper, ink, signal orange; Fraunces + Space Grotesk, hard shadows).
12. **Deployment** is configuration only (`render.yaml`, `frontend/vercel.json`); nothing was deployed.

## Test report

Everything below is real output from this repository (second-level noise such as React Router "future flag" warnings and the Starlette `httpx` deprecation notice has been filtered out; nothing else was edited).

### Backend — pytest + coverage (SQLite file)

```text
============================= test session starts =============================
platform win32 -- Python 3.14.4, pytest-9.1.1, pluggy-1.7.0
rootdir: C:\Users\Saurabh\Projects\car-dealership-inventory\backend
configfile: pytest.ini
plugins: anyio-4.15.1, cov-7.1.0
collected 135 items
tests\test_auth_login.py .....                                           [  3%]
tests\test_auth_register.py .......                                      [  8%]
tests\test_config.py .....                                               [ 12%]
tests\test_edge_cases.py ..................                              [ 25%]
tests\test_my_purchases.py ....                                          [ 28%]
tests\test_purchase_concurrency.py .                                     [ 29%]
tests\test_purchase_endpoint.py .....                                    [ 33%]
tests\test_restock.py .........                                          [ 40%]
tests\test_security.py .........                                         [ 46%]
tests\test_seed.py .........                                             [ 53%]
tests\test_validation_limits.py ....................                     [ 68%]
tests\test_vehicles_create.py ............                               [ 77%]
tests\test_vehicles_list_search.py ....................                  [ 91%]
tests\test_vehicles_update_delete.py ...........                         [100%]
============================== warnings summary ===============================
=============================== tests coverage ================================
_______________ coverage: platform win32, python 3.14.4-final-0 _______________
Name                                      Stmts   Miss  Cover   Missing
-----------------------------------------------------------------------
app\__init__.py                               0      0   100%
app\config.py                                24      0   100%
app\database.py                              28      1    96%   30
app\error_handlers.py                        11      0   100%
app\main.py                                  20      2    90%   16-17
app\models\__init__.py                        4      0   100%
app\models\purchase.py                       14      0   100%
app\models\user.py                           15      0   100%
app\models\vehicle.py                        13      0   100%
app\repositories\__init__.py                  0      0   100%
app\repositories\purchase_repository.py      19      0   100%
app\repositories\user_repository.py          19      0   100%
app\repositories\vehicle_repository.py       44      0   100%
app\routes\__init__.py                        0      0   100%
app\routes\auth.py                           12      0   100%
app\routes\deps.py                           42      0   100%
app\routes\purchases.py                       9      0   100%
app\routes\vehicles.py                       32      0   100%
app\schemas\__init__.py                       0      0   100%
app\schemas\auth.py                          16      0   100%
app\schemas\purchase.py                       8      0   100%
app\schemas\vehicle.py                       24      0   100%
app\seed.py                                  35      2    94%   63-64
app\services\__init__.py                      0      0   100%
app\services\auth_service.py                 26      0   100%
app\services\inventory_service.py            24      0   100%
app\services\security.py                     27      1    96%   54
app\services\vehicle_service.py              22      0   100%
-----------------------------------------------------------------------
TOTAL                                       488      6    99%
================== 135 passed, 1 warning in 75.09s (0:01:15) ==================
```

### Backend — same suite against PostgreSQL 16 (Docker)

```text
============================= test session starts =============================
platform win32 -- Python 3.14.4, pytest-9.1.1, pluggy-1.7.0
rootdir: C:\Users\Saurabh\Projects\car-dealership-inventory\backend
configfile: pytest.ini
plugins: anyio-4.15.1, cov-7.1.0
collected 135 items
tests\test_auth_login.py .....                                           [  3%]
tests\test_auth_register.py .......                                      [  8%]
tests\test_config.py .....                                               [ 12%]
tests\test_edge_cases.py ..................                              [ 25%]
tests\test_my_purchases.py ....                                          [ 28%]
tests\test_purchase_concurrency.py .                                     [ 29%]
tests\test_purchase_endpoint.py .....                                    [ 33%]
tests\test_restock.py .........                                          [ 40%]
tests\test_security.py .........                                         [ 46%]
tests\test_seed.py .........                                             [ 53%]
tests\test_validation_limits.py ....................                     [ 68%]
tests\test_vehicles_create.py ............                               [ 77%]
tests\test_vehicles_list_search.py ....................                  [ 91%]
tests\test_vehicles_update_delete.py ...........                         [100%]
============================== warnings summary ===============================
=============================== tests coverage ================================
_______________ coverage: platform win32, python 3.14.4-final-0 _______________
Name                                      Stmts   Miss  Cover   Missing
-----------------------------------------------------------------------
app\__init__.py                               0      0   100%
app\config.py                                24      0   100%
app\database.py                              28      7    75%   16-19, 27-29
app\error_handlers.py                        11      0   100%
app\main.py                                  20      2    90%   16-17
app\models\__init__.py                        4      0   100%
app\models\purchase.py                       14      0   100%
app\models\user.py                           15      0   100%
app\models\vehicle.py                        13      0   100%
app\repositories\__init__.py                  0      0   100%
app\repositories\purchase_repository.py      19      0   100%
app\repositories\user_repository.py          19      0   100%
app\repositories\vehicle_repository.py       44      0   100%
app\routes\__init__.py                        0      0   100%
app\routes\auth.py                           12      0   100%
app\routes\deps.py                           42      0   100%
app\routes\purchases.py                       9      0   100%
app\routes\vehicles.py                       32      0   100%
app\schemas\__init__.py                       0      0   100%
app\schemas\auth.py                          16      0   100%
app\schemas\purchase.py                       8      0   100%
app\schemas\vehicle.py                       24      0   100%
app\seed.py                                  35      2    94%   63-64
app\services\__init__.py                      0      0   100%
app\services\auth_service.py                 26      0   100%
app\services\inventory_service.py            24      0   100%
app\services\security.py                     27      1    96%   54
app\services\vehicle_service.py              22      0   100%
-----------------------------------------------------------------------
TOTAL                                       488     12    98%
================== 135 passed, 1 warning in 90.02s (0:01:30) ==================
```

### Frontend — Vitest + coverage

```text
> car-dealership-frontend@0.0.0 coverage
> vitest run --coverage
 RUN  v2.1.9 C:/Users/Saurabh/Projects/car-dealership-inventory/frontend
      Coverage enabled with v8
 ✓ src/api/api.test.js (9 tests) 72ms
 ✓ src/components/AppShell.test.jsx (4 tests) 615ms
   ✓ AppShell > shows navigation, the signed-in email and the page content 394ms
 ✓ src/auth/AuthContext.test.jsx (7 tests) 771ms
   ✓ AuthProvider > login stores token and user 338ms
 ✓ src/components/FilterBar.test.jsx (4 tests) 1171ms
   ✓ FilterBar > reports text and price changes 763ms
 ✓ src/pages/PurchasesPage.test.jsx (4 tests) 755ms
   ✓ PurchasesPage > shows loading, then each purchase with price and date 384ms
 ✓ src/components/VehicleCard.test.jsx (7 tests) 872ms
   ✓ VehicleCard > shows make, model, category, formatted price and stock 321ms
 ✓ src/components/Toast.test.jsx (3 tests) 956ms
   ✓ Toast > announces success politely and errors assertively 532ms
 ✓ src/App.test.jsx (4 tests) 339ms
 ✓ src/pages/DashboardPage.test.jsx (10 tests) 3221ms
   ✓ DashboardPage > shows a loading state, then the vehicle cards 564ms
   ✓ DashboardPage > derives category chips from the inventory and filters by category 525ms
   ✓ DashboardPage > debounces text search before calling the API 506ms
   ✓ DashboardPage > explains when filters match nothing and offers to clear them 516ms
 ✓ src/pages/DashboardAdmin.test.jsx (7 tests) 3765ms
   ✓ DashboardPage as admin > adds a vehicle and shows the new card 1776ms
   ✓ DashboardPage as admin > keeps the dialog open and shows the error when creation fails 620ms
   ✓ DashboardPage as admin > edits a vehicle in place 404ms
   ✓ DashboardPage as admin > restocks a vehicle 329ms
   ✓ DashboardPage as admin > deletes a vehicle only after confirmation 404ms
 ✓ src/components/AdminDialogs.test.jsx (10 tests) 4302ms
   ✓ VehicleFormDialog > submits a numeric payload when adding 1400ms
   ✓ VehicleFormDialog > blocks submission and explains invalid input 881ms
   ✓ VehicleFormDialog > shows server errors and stays open 684ms
   ✓ RestockDialog > rejects zero, negative and fractional amounts 573ms
 ✓ src/pages/AuthPages.test.jsx (10 tests) 4269ms
   ✓ LoginPage > submits credentials and lands on the dashboard 1099ms
   ✓ LoginPage > shows the server error and stays on the page 581ms
   ✓ LoginPage > disables the button while the request is in flight 510ms
   ✓ RegisterPage > rejects mismatched passwords without calling the API 642ms
   ✓ RegisterPage > registers, signs in and lands on the dashboard 660ms
   ✓ RegisterPage > surfaces a duplicate-email error 657ms
 Test Files  12 passed (12)
      Tests  79 passed (79)
   Start at  13:55:50
   Duration  9.27s (transform 1.63s, setup 3.77s, collect 9.93s, tests 21.11s, environment 25.34s, prepare 4.91s)
 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   98.88 |    94.75 |   91.39 |   98.88 |                   
 src               |     100 |      100 |     100 |     100 |                   
  App.jsx          |     100 |      100 |     100 |     100 |                   
 src/api           |   96.96 |    91.66 |      75 |   96.96 |                   
  api.js           |   96.96 |    91.66 |      75 |   96.96 | 18-19             
 src/auth          |   98.41 |     90.9 |      75 |   98.41 |                   
  AuthContext.jsx  |   98.41 |     90.9 |      75 |   98.41 | 32                
 src/components    |    98.3 |    94.92 |   97.61 |    98.3 |                   
  AppShell.jsx     |     100 |      100 |     100 |     100 |                   
  AuthLayout.jsx   |     100 |      100 |     100 |     100 |                   
  ...irmDialog.jsx |   90.62 |       80 |     100 |   90.62 | 15-17             
  FilterBar.jsx    |     100 |      100 |    87.5 |     100 |                   
  FormField.jsx    |     100 |      100 |     100 |     100 |                   
  Modal.jsx        |     100 |     90.9 |     100 |     100 | 29                
  ...ctedRoute.jsx |     100 |      100 |     100 |     100 |                   
  ...ockDialog.jsx |   91.89 |    88.88 |     100 |   91.89 | 23-25             
  Toast.jsx        |     100 |    95.23 |     100 |     100 | 63                
  VehicleCard.jsx  |     100 |      100 |     100 |     100 |                   
  ...ormDialog.jsx |   97.29 |     92.5 |     100 |   97.29 | 14-15             
  styles.js        |     100 |      100 |     100 |     100 |                   
 src/lib           |     100 |      100 |     100 |     100 |                   
  format.js        |     100 |      100 |     100 |     100 |                   
  ...uncedValue.js |     100 |      100 |     100 |     100 |                   
 src/pages         |     100 |    95.79 |      92 |     100 |                   
  ...boardPage.jsx |     100 |    96.05 |    87.5 |     100 | 68,72,110         
  LoginPage.jsx    |     100 |     92.3 |     100 |     100 | 15                
  ...hasesPage.jsx |     100 |    94.11 |     100 |     100 | 36                
  RegisterPage.jsx |     100 |      100 |     100 |     100 |                   
-------------------|---------|----------|---------|---------|-------------------
```

### Frontend — production build

```text
> car-dealership-frontend@0.0.0 build
> vite build
vite v5.4.21 building for production...
transforming...
✓ 54 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.19 kB │ gzip:  0.66 kB
dist/assets/index-DtySegjF.css   18.50 kB │ gzip:  4.48 kB
dist/assets/index-Dc8vvaiT.js   196.26 kB │ gzip: 61.95 kB
✓ built in 2.46s
```

## TDD process

`git log --oneline` shows the rhythm: a `test:` commit (run and seen failing), then a `feat:` commit (seen passing), then `refactor:` only where needed. The rules live in [CLAUDE.md](CLAUDE.md). Honest exceptions:

- Pure styling fixes (e.g. card width, sold-out stamp position) and the app entry glue (`main.jsx`, `index.html`, CSS) cannot be unit-tested in jsdom; they were checked with `vite build` and by screenshotting the running app.
- One `test:` commit (LIKE-wildcard escaping) is a characterization test that already passed; its commit body says so. A few tests initially passed vacuously (a 404 on a missing route) and were tightened before being committed.
- A final skeptical audit added fixes with red tests first (JWT `exp` required, UTF-8 password byte limit, integer-range caps, constant-work login, modal backdrop offset, `.env` leaking into tests) plus one characterization file (`tests/test_edge_cases.py`, 18 tests that passed on first run). Two audit slips are on record: the body of `3cce9d3` says "10 passed" but the real count was 7, and `4e8c8a9` (modal fix) accidentally also contains an earlier, since-replaced batch of screenshots. History was not rewritten.
- Every `test:`/`feat:` pair was re-verified by checking out both commits and running the new tests: 19 cycles, red then green each time.
- Infrastructure commits (`chore:`/`ci:`) have no tests of their own. The `ci:` commit also contains `render.yaml` and `frontend/vercel.json`, because the commit helper staged everything; history was not rewritten.

## Deployment (prepared, not deployed)

- **Backend → Render:** `render.yaml` defines a Python web service plus a Postgres database. Set `CORS_ORIGINS` to the frontend URL, then run `python -m app.seed` once in a Render shell (set `ADMIN_EMAIL`/`ADMIN_PASSWORD` first).
- **Frontend → Vercel:** import the repo with root directory `frontend`; `vercel.json` sets the Vite build and an SPA rewrite. Set `VITE_API_BASE_URL` to the Render URL.
- **CI:** `.github/workflows/ci.yml` runs backend pytest (with coverage, on a Postgres service) and frontend vitest + build.

## Known limitations

- No rate limiting or account lockout on login (unknown-email and wrong-password logins do the same bcrypt work and return the same 401).
- JWT in `localStorage` (simple, but exposed to XSS); no refresh tokens or logout-everywhere.
- No Playwright end-to-end suite (only screenshots); no ESLint/ruff/mypy configured.
- Render and Vercel configs are untested. The GitHub Actions workflow ran green on its first push (backend on a Postgres service, frontend tests + build).

## My AI Usage

- **Claude Code** did the implementation of this project — backend, frontend, tests, Docker/CI/deploy configuration and this README — working under the strict TDD rules and commit conventions I set in `CLAUDE.md` and in my prompt (see [PROMPTS.md](PROMPTS.md)).
- **Claude (claude.ai)** was used to plan the work.
- I reviewed the output.

TODO(Saurabh): add my personal reflection
