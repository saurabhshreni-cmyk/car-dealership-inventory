Build the ENTIRE Car Dealership Inventory System in this repo autonomously, start to finish, without stopping to ask me questions. Make reasonable decisions, record them in README under "Assumptions", and keep going until everything below is done and verified.

FIRST: the untracked nested folder car-dealership-inventory/ inside the repo is a duplicate. Diff it against the repo root; if it adds nothing, delete it. Then read CLAUDE.md and obey every rule in it. Do not stop after scaffolding.

SPEC (from the kata):
- Backend: FastAPI + SQLAlchemy 2 + PostgreSQL (real DB via DATABASE_URL; if Docker is unavailable here, use a SQLite FILE database for local dev and tests, with Postgres supported via env). JWT auth.
- Endpoints: POST /api/auth/register, POST /api/auth/login. Vehicles (all protected by JWT): POST /api/vehicles, GET /api/vehicles, GET /api/vehicles/search (make, model, category, min_price, max_price; register before /{id}), PUT /api/vehicles/{id}, DELETE /api/vehicles/{id} (admin only). Inventory: POST /api/vehicles/{id}/purchase (decrease quantity; 409 if out of stock), POST /api/vehicles/{id}/restock (admin only, positive amount). Vehicle = unique id, make, model, category, price, quantity.
- Admin accounts come from a seed script using ADMIN_EMAIL and ADMIN_PASSWORD env vars; registration always creates a normal user. Add/update/delete/restock are admin-only. Also add a Purchase table plus GET /api/purchases/me.
- Make purchase atomic (single conditional UPDATE ... WHERE quantity > 0). Write a concurrency test first.
- Frontend: React + Vite + Tailwind SPA. Register and login forms, dashboard of vehicle cards, search and filter (make, model, category chips, price range), Purchase button disabled when quantity is 0, My Purchases page, admin-only add/edit/delete/restock UI, protected routes, loading/empty/error states, toasts, responsive, accessible. Make the design distinctive and polished, not a default template.

PROCESS (non-negotiable, this is what is being graded):
- Real strict TDD with separate commits for every cycle: write the test, RUN it and see it fail, commit "test: ..."; implement, RUN it and see it pass, commit "feat: ..."; refactor if needed, commit "refactor: ...". Never write production code before a failing test. Frontend components get Vitest and React Testing Library tests first as well.
- Every commit uses --cleanup=verbatim and ends with two blank lines then the trailer from CLAUDE.md. Use small, descriptive commit messages. Never squash, amend old commits or rewrite history. Push to origin regularly.
- Clean code and SOLID: thin routes, services, repositories, schemas, docstrings, meaningful names. Config and secrets only through env vars; keep .env out of git.
- Install dependencies in a venv and npm; actually run the full backend and frontend test suites and the frontend build, and fix everything until they pass.

DELIVERABLES:
1. docker-compose.yml for the whole stack (db, backend, frontend), a seed script with demo vehicles, and a GitHub Actions workflow running backend pytest with coverage and frontend vitest.
2. README.md: project explanation, mermaid architecture diagram, setup and run instructions for backend and frontend and docker, API summary, assumptions and decisions, REAL test report (paste the actual pytest, coverage and vitest output), and screenshots. Take screenshots of the running app (login, dashboard, admin view) with Playwright if it is available, save to docs/screenshots and embed them.
3. In the README add a "My AI Usage" section. Write it truthfully: state that Claude Code did the implementation under strict TDD instructions from me, Claude (claude.ai) was used to plan the work, and I reviewed the output. Do NOT invent anything I did manually. End the section with "TODO(Saurabh): add my personal reflection" because I will write that myself.
4. PROMPTS.md at the repo root: put this exact prompt in it verbatim. Do not summarize or edit anything. I will append the full session transcript myself.
5. Deployment: only prepare config (render.yaml for the backend with Postgres, vercel.json for the frontend, documented env vars). Do not deploy, I will do that.

When finished, push everything, then give me: the git log --oneline, test and coverage numbers, how to run it, and an honest list of anything unverified or skipped.
