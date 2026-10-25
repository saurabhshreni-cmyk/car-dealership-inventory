# PROMPTS
Part A is an excerpt from my planning chat with Claude (claude.ai). I only included the prompt pack Claude gave me; the rest of that chat contains private personal documents and messages and is omitted.
Part B is a copy of the Claude Code conversation as it appeared on screen. Collapsed tool-output blocks (for example "Ran 13 commands") were not expanded, so they appear only as their summary lines.

## Part A: planning chat excerpt (claude.ai)

Let me read the JD and your resume first, so the prompts fit the role.

Congrats on the shortlist! I've read the JD, your resume, the kata and your friend's advice. Your friend's advice is good, and it matches the JD.

## What Incubyte is actually grading

Incubyte is an XP/TDD shop. The working app is the minimum. They will mostly look at these things:
1. **Commit history**: red (failing test), then green, then refactor, as separate commits. One giant "added everything" commit is the fastest way to get rejected.
2. **Honest AI use**: a co-author trailer on every AI-assisted commit, a "My AI Usage" section, and a raw `PROMPTS.md`.
3. **Clean code and SOLID**: small services, thin routes, meaningful names.
4. **You understanding your own code** in the interview.

## My decisions (change any you disagree with)

- **Backend:** FastAPI, SQLAlchemy and PostgreSQL, tested with pytest. Java isn't allowed in the kata, and this is your strongest stack (GraphRAG++ has 82 pytest tests).
- **Frontend:** React, Vite, Tailwind, Vitest and React Testing Library.
- **Your friend's "3 fundamentals":** I'm assuming he means TDD, clean code/SOLID, and git hygiene. These are the kata's three process rules.
- **Uniqueness (your 30–45 min):**
  - Purchase that can't oversell. It uses an atomic DB update, with a concurrency test.
  - A purchase history.
  - CI with a coverage report.
  - `docker compose up` for the whole stack.
  - A polished UI.
- **Spec gaps** (I'll have Claude Code document each one in the README):
  - Admin accounts are seeded, not self-registered.
  - Add, update and delete are admin-only. This matches the frontend section, but it is stricter than the backend list. Tell me if you'd rather follow the backend list literally.
  - `GET /vehicles` returns all vehicles, with an `in_stock` filter.

## Prompt pack (paste into Claude Code, in order)

**Prompt 0: setup**
```
Create a new folder car-dealership-inventory with git init. Create CLAUDE.md with these non-negotiable rules for this project:
1. Strict TDD: never write production code without a failing test first. Work in small cycles with SEPARATE commits: "test: ..." (red, show me the failing output), "feat: ..." (green), "refactor: ..." (only if needed).
2. Every commit you help with ends with two blank lines then: Co-authored-by: Claude <noreply@anthropic.com>
3. Clean code and SOLID: thin routes, logic in services, DB access in repositories, meaningful names, docstrings on public functions.
4. Stack: FastAPI + SQLAlchemy 2 + PostgreSQL (real DB, never in-memory for the app), JWT auth, pytest. Frontend: React + Vite + Tailwind + Vitest + React Testing Library.
5. Never commit secrets. Create .gitignore FIRST (.env, venv/, __pycache__/, node_modules/, .pytest_cache/, coverage output) and .env.example.
6. Small commits, descriptive messages, one concern per commit.
Then scaffold backend/ and frontend/ folders, a docker-compose.yml for Postgres, make the first commit "chore: project scaffold", and stop.
```

**Prompt 1: plan only (use plan mode, no code)**
```
Read CLAUDE.md. Do NOT write code yet. Produce PLAN.md with: (a) the data model (User with role, Vehicle with unique id/make/model/category/price/quantity, Purchase), (b) folder structure with layers (routes, services, repositories, schemas), (c) the full API contract with status codes and error cases for every endpoint in the kata, (d) an ordered list of TDD cycles, each one behavior long, (e) assumptions where the spec is ambiguous (admins are seeded via env/script; add/update/delete/restock are admin-only; GET /vehicles returns all with an in_stock filter; /search must be registered before /{id}). Commit PLAN.md as "docs: add implementation plan".
```

**Prompt 2: auth (TDD)**
```
Follow PLAN.md. Implement auth with strict red-green-refactor. Cycle by cycle, each with separate commits: register (success, duplicate email, weak or invalid input), password hashing (never store plaintext), login (success, wrong password, unknown user), JWT creation and verification, a get_current_user dependency, and a require_admin dependency. Show me failing output before each green step. Test DB: use a separate test database via dependency override.
```

**Prompt 3: vehicles (TDD)**
```
Continue with TDD. Cycles: POST /api/vehicles (admin; validation: price >= 0, quantity >= 0, required fields), GET /api/vehicles (authenticated, supports in_stock filter and pagination), GET /api/vehicles/search (make, model, category, min_price, max_price, combinable, case-insensitive), PUT /api/vehicles/{id} (404 case), DELETE /api/vehicles/{id} (admin only; 403 for normal user, 404 missing). Separate red/green/refactor commits. Refactor duplicated query logic into the repository after green.
```

**Prompt 4: inventory plus the uniqueness piece**
```
Cycles: POST /api/vehicles/{id}/purchase (decrements by 1, 409 when out of stock, records a Purchase row for the user), POST /api/vehicles/{id}/restock (admin only, positive amount only). Make the purchase atomic so concurrent buyers can never oversell (single conditional UPDATE ... WHERE quantity > 0, not read-then-write). Write a concurrency test first that fails with a naive implementation, then make it pass. Also add GET /api/purchases/me. Then run coverage and tell me which lines are untested and why.
```

**Prompt 5: frontend**
```
Build the React SPA with Vite and Tailwind, test-first with Vitest and React Testing Library (write component tests before components, separate commits). Pages: Register, Login, Dashboard with a vehicle card grid, search and filter bar (make, model, category chips, price range), a Purchase button disabled when quantity is 0 with a toast on success and error, and My Purchases. Admin-only UI: add, edit and delete vehicle modals and a restock action. Keep the JWT in memory plus localStorage and add a protected-route wrapper. Make it responsive and visually distinctive: not a default template, with a clear design identity, empty and loading states, and accessible labels.
```

**Prompt 6: polish and DevOps**
```
Add a GitHub Actions workflow that runs backend pytest with coverage and frontend vitest on every push. Add a Dockerfile for each side and make docker compose up start the whole stack with a seeded admin and some demo vehicles. Add a Makefile or scripts for test, run and seed. Commit each separately.
```

**Prompt 7: README (I'll help with the "My AI Usage" wording)**
```
Write README.md with: project explanation, architecture diagram (mermaid), setup instructions for backend and frontend and docker, API summary, my assumptions and design decisions, a test report section (paste real pytest and coverage and vitest output), and placeholders for screenshots and a deployed link. Leave the "My AI Usage" section as a heading only with TODO. I will write it myself.
```

**Prompt 8: deploy (optional brownie points)**
```
Prepare deployment: backend plus managed Postgres on Render, frontend on Vercel, environment variables documented, CORS configured from env. Give me the exact steps; don't commit any secrets.
```

## Things you must do yourself

- **Read every diff** before you let it commit. They will grill you on this in the interview.
- **Write "My AI Usage" in your own words.** Say you used Claude Code for boilerplate, tests and refactoring, and claude.ai for planning (that's this chat). Also include what you reviewed and fixed yourself. Tell me and I'll draft it in your natural voice.
- **PROMPTS.md must be raw and unedited.**
  - Paste every prompt you send to Claude Code, plus the transcripts. Use `/export` or copy the terminal text. No summaries.
  - Add this claude.ai chat as a shared link too, since I helped plan it.
- **Check the history before you submit:** `git log --oneline` should show test/feat/refactor patterns, and every AI-assisted commit should have the co-author line.
- **Take screenshots** for the README only after the UI is done.

## Interview prep

Be ready to explain the following. It's also where your project is strongest.
- Why the purchase is atomic.
- How JWT and the admin check work.
- Why you split routes, services and repositories.
- One thing the AI got wrong that you caught.

Do you know the submission deadline? Send it over and I'll help you split the work. If you want, I can also draft the "My AI Usage" section once you've finished building.





Good scaffold, and the commit with the trailer is right. The one thing to fix before Prompt 1 is the temporary location. If that session folder gets deleted, you lose the repo, and the git history is the thing Incubyte grades. Say yes to the move now.

**Paste this into Claude Code:**
```
Yes, please move the repo to a permanent folder on my computer: C:\Users\<my-username>\Projects\car-dealership-inventory (create Projects if it doesn't exist). Keep the full git history and the core.longpaths setting. After the move:
1. Run `git log -1 --format=%B | cat -A` and show me the output so I can confirm the Co-authored-by trailer has two blank lines before it.
2. Add this line to CLAUDE.md under the commit rules: "Always commit with --cleanup=verbatim so the two blank lines before the Co-authored-by trailer are preserved." Commit that as "docs: note commit cleanup flag", with the trailer.
3. Create a PUBLIC GitHub repo named car-dealership-inventory under my account with gh, add it as origin, and push main, so the work is backed up from the start.
4. Delete nothing in the old location until I confirm the new one works.
Then stop.
```
Replace `<my-username>` with your Windows username. Claude Code will probably ask for folder access, so approve it.

After it finishes, do a quick check:
- The new folder exists and `git log` shows both commits.
- The GitHub repo is public. This is a requirement of the kata.
- Nothing like `.env` was pushed. Only `.env.example` should be there.

When that's confirmed, **send Prompt 1 (the plan) in plan mode**. Read `PLAN.md` before you approve it. It's your design, and the interviewer will ask about it.

Also save every prompt you've sent so far (Prompt 0, this one, and Claude Code's replies) for `PROMPTS.md`. It's easy to forget them later.




You can get this done with one prompt, and it stays honest. Claude Code can run the whole red, green, refactor cycle on its own. It writes tests, runs them and watches them fail, commits, implements, and commits again. Don't ask it to build everything in one commit or backfill history afterwards. That looks fake in `git log` and falls apart when they ask about it. The git history is what Incubyte reads first.

Yes, have it delete the stray nested folder. The prompt below checks that it's a duplicate first.

**Paste this into Claude Code (it's long on purpose):**
```
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
```

**While it runs and after, do these four things:**
1. Don't edit the commit history. Check that `git log --oneline` shows test, feat and refactor commits alternating.
2. Add the real transcript to `PROMPTS.md`. Use `/export` in Claude Code, and add the claude.ai chat link for this planning conversation.
3. Write your own "My AI Usage" reflection. Be honest that Claude Code did most of the implementation.
4. Spend about 30–40 minutes reading the code. Neopat only needs the submission, but the interview is the real gate, and they will ask you to explain the atomic purchase, the JWT flow and the layers. Tell me when it's done and I'll give you likely interview questions from your own code.

Send me the final summary Claude Code gives you, and I'll check it before you submit.



Here is a verification prompt. It tells Claude Code to audit its own work the way a skeptical reviewer would, fix real problems with proper TDD commits, and report only what it actually checked.

```
Do a skeptical final audit of this repo before I submit it. Act like an Incubyte reviewer who is looking for reasons to reject. Do not trust your earlier summary: re-run and re-check everything yourself. Fix real problems with proper TDD commits (test: red, then feat:/fix: green, --cleanup=verbatim, trailer). Do not rewrite, amend or squash history. Do not spawn agents unless needed.

1. FRESH-CLONE TEST: clone the public GitHub repo into a brand-new temp folder (not this working directory), then follow ONLY the README to set it up and run it, with no help from this folder or my local .env. Fix the README if any step is missing or wrong.
2. KATA COMPLIANCE: check every requirement against the code and list each one as PASS or FAIL with evidence (file and line, or a command you ran): all 9 endpoints and their auth rules, real database (not in-memory), JWT, vehicle fields, search by make/model/category/price range, purchase disabled at 0 stock in the UI, admin-only UI, README sections (explanation, setup, screenshots, My AI Usage, test report), PROMPTS.md at the root, public repo.
3. GIT HISTORY: run git log and verify the red-green-refactor pattern is real. For a sample of at least 8 feature cycles, check out the test: commit and confirm the new tests FAIL, then check out the next commit and confirm they PASS. List any commit missing the trailer, any commit that mixes unrelated changes, and any place where production code came before its test. Report honestly; don't fix by rewriting history.
4. SECURITY AND SECRETS: scan the whole repo and all git history for secrets (.env, JWT keys, passwords, tokens). Confirm .gitignore covers .env, venv/, __pycache__/, node_modules/. Check password hashing, JWT expiry and algorithm handling, input validation, SQL injection, admin-escalation paths (can registration ever create an admin?), and CORS.
5. BEHAVIOR EDGE CASES: write and run extra tests for: purchase at quantity 0, restock with 0 or negative, search with min_price > max_price, duplicate registration, expired or tampered tokens, deleting a vehicle that has purchases, and non-admin access to every admin endpoint.
6. QUALITY: run the full backend and frontend suites again, plus the frontend build. Report exact pass counts and coverage. Check the README test report matches the real numbers; fix it if not. Look for dead code, unclear names, missing docstrings and SOLID violations, and fix the worthwhile ones.
7. UI CHECK: start the app, take fresh screenshots at desktop and mobile widths for login, dashboard, search results, a sold-out vehicle, admin view and my purchases, and look at each one. Report anything broken, ugly or misaligned, and fix it.
8. PROMPTS.md AND AI USAGE: confirm PROMPTS.md contains the verbatim prompt with no summaries, and that "My AI Usage" claims nothing that did not happen.

Finish by pushing any fixes, then give me: a table of every check with PASS or FAIL, what you fixed, what you could not verify and why, and the final git log --oneline count. If something is wrong, say so plainly.
```

When it finishes, paste me its report. I'll check it, then we'll go through the remaining steps in order: the transcript in `PROMPTS.md`, your reflection, the deploy, and interview prep.

## Part B: Claude Code conversation (copied from screen)

Create a new folder car-dealership-inventory with git init. Create CLAUDE.md with these non-negotiable rules for this project:
1. Strict TDD: never write production code without a failing test first. Work in small cycles with SEPARATE commits: "test: ..." (red, show me the failing output), "feat: ..." (green), "refactor: ..." (only if needed).
2. Every commit you help with ends with two blank lines then: Co-authored-by: Claude <noreply@anthropic.com>
3. Clean code and SOLID: thin routes, logic in services, DB access in repositories, meaningful names, docstrings on public functions.
4. Stack: FastAPI + SQLAlchemy 2 + PostgreSQL (real DB, never in-memory for the app), JWT auth, pytest. Frontend: React + Vite + Tailwind + Vitest + React Testing Library.
5. Never commit secrets. Create .gitignore FIRST (.env, venv/, __pycache__/, node_modules/, .pytest_cache/, coverage output) and .env.example.
6. Small commits, descriptive messages, one concern per commit.
Then scaffold backend/ and frontend/ folders, a docker-compose.yml for Postgres, make the first commit "chore: project scaffold", and stop.

Ran 3 commands
The audit is finished and pushed. It found six real bugs, all fixed with a test: commit followed by a fix: commit, and the repo is now at 72 commits with CI green on 5677cec. I also fixed two tooling bugs (screenshot sweep, README setup step).

What I fixed
#	Problem found	How it was found
1	Following the README (cp ../.env.example .env) made 3 seed tests fail, because the tests read the developer’s .env.	Fresh clone
2	A correctly signed JWT with no exp claim was accepted.	Security review
3	A 40-character password of 2-byte characters passed the length check, then crashed bcrypt (server error).	Edge case
4	Quantity, restock amount and path ids were unbounded. On PostgreSQL, values past 32-bit would raise a 500. They now return 422.	Edge case
5	Login skipped bcrypt for unknown emails, so response time revealed which accounts exist.	Security review
6	Modal backdrop started 32 px down, leaving the header undimmed and clipping the mobile dialog. Tailwind’s space-y-8 margin was shifting the fixed overlay.	Screenshots
I also moved a shared button style out of LoginPage and recaptured all screenshots at desktop and mobile widths. The README setup steps and test report now match the real numbers.

Checks
Check	Result
Fresh clone, README only, local setup (backend, frontend install/test/build)	PASS after fix #1 (135 passed with .env present)
Fresh clone, docker compose up --build, then login and vehicle list	PASS (10 seeded vehicles)
Red/green history	PASS: 19 test-then-feature pairs checked out. The new tests failed (or couldn’t load) on the test: commit and passed on the next commit.
Every commit has the trailer with two blank lines	PASS for all 72
test: commits touch only test files	PASS
Backend 135 tests (SQLite, 99%)	PASS
Backend 135 tests (PostgreSQL 16, 98%)	PASS
Frontend 79 tests, 98.88% statements	PASS
Frontend production build	PASS
All 9 endpoints and their auth rules (routes/auth.py, vehicles.py, purchases.py; admin guards at vehicles.py:21,47,57,79)	PASS
Real database (DATABASE_URL, Postgres verified)	PASS
Vehicle fields (models/vehicle.py:16-21)	PASS
Search by make, model, category, price range	PASS
Purchase button disabled at 0 stock (VehicleCard.jsx:62)	PASS
Admin-only UI (VehicleCard.jsx:70, DashboardPage.jsx:155)	PASS
README has explanation, setup, screenshots, test report, My AI Usage	PASS
PROMPTS.md at the root	PASS
Public repo	PASS
Secrets in the whole git history	PASS: only .env.example placeholders and CI-only throwaways. .gitignore covers .env, venv/, __pycache__/, node_modules/.
Registration can never create an admin	PASS (tested, including role claims inside a token)
Edge cases: sold-out purchases, restock 0 or negative, inverted price range, duplicate registration, expired/tampered tokens, deleted vehicle with purchases, non-admin on all four admin endpoints	PASS
UI screenshots	PASS after fix #6. No horizontal overflow and no page errors.
Things to know
Edge-case tests: The 18 tests in the edge-case commit passed on first run, so they are regression guards, not red tests. The commit body says so.
History blemishes (not rewritten): The commit body of 3cce9d3 says “10 passed” but the real number was 7. My commit helper also swept stale pre-fix screenshots into 4e8c8a9, and earlier into the ci: commit alongside render.yaml and vercel.json. The README’s TDD section records these.
Process slip: Cleaning up my temporary worktree deleted frontend/node_modules through a junction. It’s git-ignored, so I reinstalled it with npm ci, and no tracked files were affected.
What I could not verify
render.yaml and frontend/vercel.json: they are untested because nothing was deployed.
PROMPTS.md: I can’t compare it byte-for-byte with your original message. It matches the prompt as I received it, with no header or summary added.
My AI Usage: it claims only what you told me to state. The claims about claude.ai planning and your review come from you, not from anything I observed.
Still open: There is no rate limiting or lockout on login. The JWT is stored in localStorage. There is no Playwright end-to-end suite and no linter configured. On mobile, search results sit below the filter panel, so users have to scroll.
Review agents: I did not run the code-reviewer or security-reviewer agents, since you said not to spawn agents unless needed.
Update README.md only in the "My AI Usage" section: replace the whole section (including the TODO line) with the exact text below, word for word, keeping it as a "## My AI Usage" section in the same place. Don't change any other part of the README. Don't add claims of your own.

## My AI Usage

**Tools I used**
- Claude (claude.ai chat) for planning
- Claude Code for building the project

**How I used them**
I gave Claude the company JD, my resume and the assignment, and used it to understand what the kata is really asking for (TDD history, co-author trailers, PROMPTS.md), to pick the stack, to plan the steps and to get ideas that make the project a bit different, like the atomic purchase, purchase history, CI and docker compose. It also wrote the prompts I pasted into Claude Code.

Claude Code wrote the code and the tests. I set it up with a CLAUDE.md that forces red-green-refactor and a co-author trailer on every commit. I didn't write the code line by line myself. After the build I ran a second prompt that made it audit its own work like a strict reviewer. That audit found six real bugs (for example a token without an expiry being accepted, a login timing leak, and a modal layout bug), and they were fixed test-first.

**What I did myself**
I ran the test suites, clicked through the app, and ran the audit prompt. I'm still reading the code in detail for the interview.

**Reflection**
AI made me a lot faster. The downside is that it is easy to end up knowing only the surface of what it built instead of the depth. I understand the idea behind the atomic purchase and what the audit fixed, but I'm still going through the code properly. I want to keep using AI for speed while making sure I actually understand every piece I submit.

Then commit with message "docs: add my AI usage reflection", using --cleanup=verbatim and the Co-authored-by trailer from CLAUDE.md, and push. Show me git log -1 and confirm the working tree is clean.

Replace My AI Usage section and review the diff
Line endings got converted by my rewrite, which would touch the whole file. Reverting and redoing it byte-preserving.

Ran 2 commands
The “My AI Usage” section in README.md now holds your text word for word, and the old TODO line is gone. The commit is pushed.

My first replacement rewrote the file’s line endings and showed up as a diff of the whole file. I reverted that and redid it keeping the original Windows (CRLF) line endings. The final diff touches only that section (13 lines added, 4 removed).

git log -1:

5f668cc docs: add my AI usage reflection
The message body is the subject, two blank lines, then Co-authored-by: Claude <noreply@anthropic.com>, committed with --cleanup=verbatim. The working tree is clean, and main is up to date with origin/main.