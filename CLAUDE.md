# Car Dealership Inventory — Project Rules (non-negotiable)

## 1. Strict TDD
- Never write production code without a failing test first.
- Work in small cycles, each step a SEPARATE commit:
  1. `test: ...` — red. Run the test and show the failing output before committing.
  2. `feat: ...` — green. Minimal code to pass.
  3. `refactor: ...` — only if needed, tests stay green.

## 2. Commit trailer
Every commit Claude helps with ends with two blank lines, then:

```
Co-authored-by: Claude <noreply@anthropic.com>
```

## 3. Clean code and SOLID
- Thin routes: parse/validate input, call a service, return the response.
- Business logic lives in services; DB access lives in repositories only.
- Meaningful names; docstrings on all public functions/classes.

## 4. Stack
- Backend: FastAPI, SQLAlchemy 2, PostgreSQL (real DB — never in-memory/SQLite for the app), JWT auth, pytest.
- Frontend: React, Vite, Tailwind, Vitest, React Testing Library.
- Local Postgres via `docker-compose.yml`.

## 5. Secrets
- Never commit secrets. `.env` is git-ignored; document variables in `.env.example`.
- `.gitignore` covers .env, venv/, __pycache__/, node_modules/, .pytest_cache/, coverage output.

## 6. Commits
- Small, descriptive, one concern per commit. Conventional types: feat, fix, test, refactor, docs, chore.

## Layout
```
backend/   FastAPI app (app/routes, services, repositories, models, schemas) + tests/
frontend/  React + Vite app + Vitest tests
```
