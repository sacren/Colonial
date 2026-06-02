# Cypress-for-Laravel Build Plan

## Goal

Build out Cypress E2E coverage for this Laravel 13 / Livewire 4 / Sail / Cypress project across well-scoped phases: feature coverage, framework maturity, CI/CD, documentation. Each phase ships as one or more PR-reviewed commits.

## Standing rules

1. **Feature branches.** Every commit (or tightly-scoped commit set) lives on `feature/<short-slug>` cut from `13.x-livewire-8038`. Pushed to GitHub, opened as a PR, merged. No direct commits to the working branch.
2. **Handoff docs and plan in the repo.** AI handoff docs live under `docs/ai-workflow/`, one per commit, named `NN-short-slug.md`. The plan itself lives at `docs/ai-workflow/00-cypress-plan.md` and is updated as work progresses.
3. **Tests on every change.** New behaviour gets a spec. Refactors get a clean local Cypress run before the PR opens.
4. **Pint before PHP, Cypress before PR.** `vendor/bin/pint --dirty --format agent` for any PHP touch; `pnpm exec cypress run` clean before requesting review.
5. **PR descriptions designed for review.** Every PR body has: Context (why), What changed (bullets), QA notes (how to verify), screenshots when UI is touched.
6. **Watch for organic review opportunities.** If a real review-worthy issue appears in any PR — redundant selector, weak assertion, missed extraction — leave a self-review comment, push a fix, merge.
7. **Document real flake fixes.** If a real flake surfaces during Phase 4 work, fix the root cause and document the find-and-fix in the commit message and `cypress/README.md`. Do not manufacture a flake if none appears organically.

---

## Phase 1 — Process foundation (1 commit)

### Commit 4 — Establish in-repo AI-workflow docs
- Branch: `feature/ai-workflow-docs`
- Create `docs/ai-workflow/` containing:
  - `README.md` describing the handoff pattern.
  - `00-cypress-plan.md` (this plan).
  - `03-welcome-smoke-test.md` (handoff doc for the welcome smoke test shipped in commit 3).
- Open PR, merge.

---

## Phase 2 — Coverage breadth (4 commits)

### Commit 5 — Welcome page navigation links
- Spec asserts Log in and Register links present + correct `href`.
- Branch: `feature/welcome-nav-links`

### Commit 6 — Login error path
- Visit `/login`, submit bad credentials, assert error message rendered.
- No DB seeding required — bad creds are bad whether a user exists or not.
- Branch: `feature/login-error-flow`

### Commit 7 — Register happy path
- Fill `/register` with factory-shaped data, submit, assert redirect.
- Note: `/dashboard` has `verified` middleware; success target depends on Fortify's MustVerifyEmail setting. Inspect before writing the assertion.
- Branch: `feature/register-happy-path`

### Commit 8 — Authenticated dashboard
- Factory-create a verified user in the DB, log in (via a stub or UI), assert dashboard renders, sign-out works.
- This is the spec that motivates extracting `cy.login` in commit 9.
- Branch: `feature/dashboard-auth`

---

## Phase 3 — Framework maturity (3 commits)

### Commit 9 — Custom command `cy.login`
- Extract repeated UI-login from specs 7/8 into `cypress/support/commands.js`.
- Refactor specs to use it.
- Branch: `feature/cy-login-command`

### Commit 10 — Fixtures
- `cypress/fixtures/users.json` for test user shapes.
- Specs load via `cy.fixture()`.
- Branch: `feature/test-fixtures`

### Commit 11 — Network intercepts
- One spec demonstrating `cy.intercept()` against a Livewire or Fortify request.
- Branch: `feature/network-intercepts`

---

## Phase 4 — CI/CD + monitoring (5 commits)

Environment notes for this phase:
- **Pre-existing CI (the plan originally missed this).** The repo was scaffolded with two starter-kit workflows:
  - `.github/workflows/lint.yml` — runs `composer lint` (`pint --parallel`, the **fixer**) on PHP 8.4.
  - `.github/workflows/tests.yml` — runs `./vendor/bin/pest` across a PHP 8.3/8.4/8.5 matrix, with a Node build.
  Both trigger **only** on `develop`/`main`/`master`/`workos`, so they never run on `13.x-livewire-8038` or its PRs. Phase 4 builds **around** these workflows, not as a parallel `ci.yml`.
- **Don't run Sail in CI.** Use native PHP + Node on the runner (the existing workflows already do).
- **Flux credentials.** `composer install` needs the Flux license; the existing workflows set it with `composer config http-basic.composer.fluxui.dev "${{ secrets.FLUX_USERNAME }}" "${{ secrets.FLUX_LICENSE_KEY }}"`. The Cypress job needs the same secrets.
- **Database:** SQLite **file** via `DB_CONNECTION=sqlite` for the Cypress job — a served app is a separate process, so `:memory:` won't share state across requests.
- **`baseUrl` for CI:** `cypress.config.js` hard-codes the Sail dev URL (`http://laravel.local:8038`). Do **not** edit the committed value; override per run with `CYPRESS_BASE_URL` → `http://127.0.0.1:8000` (Artisan serve).
- **Package manager:** the project is pnpm (`pnpm-lock.yaml`); the starter workflows use npm. New CI work uses pnpm to match the project.

### Commit 12 — Wire existing CI onto the project branch (and make lint fail-closed)
- **Supersedes the original "new `ci.yml` running `pint --test`"**, which would duplicate `lint.yml`. The real gaps: CI never fires for this branch, and the lint job *fixes* rather than *fails*.
- Edit `.github/workflows/lint.yml`:
  - Add `13.x-livewire-8038` to the `push` and `pull_request` branch filters.
  - Change the Pint step from `composer lint` (fixer — mutates files, never fails a build) to `composer lint:check` (`pint --parallel --test`, fails on violations). Drop the commented-out auto-commit block, now moot.
- Edit `.github/workflows/tests.yml`:
  - Add `13.x-livewire-8038` to the `push` and `pull_request` branch filters so Pest runs on our PRs too.
- This is the genuine "scaffold": it proves the runner works for our branch flow before adding Cypress, using the Pint check the original commit 12 wanted — without a redundant file.
- **Capture the organic PR review here.** That the planned `ci.yml` was redundant and that no workflow targeted our branch is a real review finding (standing rule 6) — record it in the PR description / commit rationale. This satisfies the review-artifact goal without the manufactured demo in commit 18.
- Branch: `feature/ci-on-branch`

### Commit 13 — Cypress in CI
- Add a new `.github/workflows/cypress.yml` (kept separate from `tests.yml`: Cypress needs the app **served** and a distinct setup). Trigger on `push`/`pull_request` for `13.x-livewire-8038`.
- Job (native, no Sail):
  - `actions/checkout`.
  - `shivammathur/setup-php` at 8.3; `actions/setup-node` at 22 with pnpm.
  - Flux credentials via `composer config http-basic...` (secrets as above).
  - `composer install --no-interaction --prefer-dist`.
  - `pnpm install`, then `pnpm run build` (the Vite manifest must exist for the app to render).
  - `cp .env.example .env`; set `DB_CONNECTION=sqlite`; create `database/database.sqlite`; `php artisan key:generate`; `php artisan migrate --force`.
  - Start the app: `php artisan serve --host=127.0.0.1 --port=8000 &`, then block on it (e.g. `npx wait-on http://127.0.0.1:8000`).
  - Run headless: `CYPRESS_BASE_URL=http://127.0.0.1:8000 pnpm exec cypress run`.
- The test-only `/testing/login` route registers because CI is not production (`APP_ENV=local` from `.env.example`), so `cy.login` and `User::factory()` work against the migrated SQLite DB.
- Branch: `feature/ci-cypress`

### Commit 14 — Artifacts on failure
- Upload `cypress/screenshots/` and `cypress/videos/` as workflow artifacts when the Cypress job fails.
- Branch: `feature/ci-artifacts`

### Commit 15 — Flake retries
- `retries: { runMode: 2, openMode: 0 }` in `cypress.config.js`.
- Document retry policy in `cypress/README.md` (created next phase).
- **Standing rule 7 applies:** if any real flake was observed across commits 12–14, fix the root cause here and document.
- Branch: `feature/flake-retries`

### Commit 16 — Failure notification (monitoring)
- Add a workflow step that posts to a Slack or Discord webhook on failed runs.
- Webhook URL stored as `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL` repo secret.
- Branch: `feature/ci-notification`

---

## Phase 5 — Polish (2 commits)

### Commit 17 — `cypress/README.md`
- File naming, selector preference order, custom-command index, how to run locally + in CI, how to debug a failure, retry policy, link to `docs/ai-workflow/`.
- Branch: `feature/cypress-readme`

### Commit 18 — PR review demo (conditional)
- If standing rule 6 already produced a real review-comment artifact on an earlier PR, **skip this commit entirely** and note that in the next plan update.
- If no organic review occurred across commits 5–15: open a `feature/review-demo` PR containing one small deliberate flaw (recommended: `cy.wait(1000)` masking a race). Leave a review comment articulating *why* it's wrong (Cypress retry semantics). Push fix. Merge.

---

## Scope

- **Playwright POC** — out of scope. Cypress depth is the focus.
- **TestRail** — out of scope.

---

## How to resume in a new session

1. Read this plan at `docs/ai-workflow/00-cypress-plan.md` (the auto-loaded memory entry points here).
2. Run `git log --oneline -20` and check the GitHub remote PR list to see what's landed.
3. Match against this plan to find the next commit.
4. Confirm direction with the user before starting any commit.
5. Open the corresponding handoff doc in `docs/ai-workflow/` once started.

## Living plan

Refinement is expected as work progresses. PR reviews can suggest plan edits.
