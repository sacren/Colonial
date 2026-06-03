# 13 — Cypress in CI

## Summary

Adds `.github/workflows/cypress.yml`: a headless Cypress run on GitHub Actions.
Native PHP + Node (no Sail), a fresh SQLite database, the app served by
`artisan serve`, and the suite run against it via a `CYPRESS_BASE_URL` override.
This is the payoff of Phase 4 — the E2E suite now guards every PR, not just local
desktop runs.

## File added

`.github/workflows/cypress.yml` — a single `e2e` job:

1. **Checkout**, **PHP 8.3** (`shivammathur/setup-php`), **pnpm**
   (`pnpm/action-setup` with no `version:` — it reads `package.json`'s
   `"packageManager": "pnpm@10.24.0"`, the single source of truth, so CI and
   local stay in lockstep), **Node 24** with the pnpm cache. Node is pinned
   in-workflow rather than via the `packageManager` field, which covers pnpm
   only; a `.nvmrc`/`engines` Node pin is a deliberate follow-up if cross-tool
   parity is wanted. (Note: `lockfileVersion: '9.0'` is the lockfile *format*,
   shared by pnpm 9 and 10 alike — it does not imply a pnpm major.)
2. **Flux credentials** via `composer config http-basic...` (same secrets the
   existing `lint.yml`/`tests.yml` already rely on) — required before
   `composer install`, since Flux is a Composer dependency.
3. `composer install` + `pnpm install`, then an explicit `pnpm exec cypress
   install` to guarantee the Cypress binary (see rationale below).
4. **Prepare environment:** `cp .env.example .env`, `key:generate`, and rewrite
   `APP_URL` to `http://127.0.0.1:8000` (the serve host).
5. **Prepare SQLite:** recreate `database/database.sqlite` from scratch and
   `migrate --force`. `.env.example` already sets `DB_CONNECTION=sqlite`.
6. **Build assets** (`pnpm run build`) — the Vite manifest must exist or the app
   500s; the built JS is also what makes Livewire (and the intercept spec) work.
7. **Serve** `php artisan serve` in the background, **wait** with `npx wait-on`,
   then **run** `pnpm exec cypress run` with `CYPRESS_BASE_URL` set.

## Rationale

### Native runner, not Sail

Sail is a local Docker convenience; in CI it's pure overhead. The existing
workflows already run native PHP + Node on the runner, and this job follows suit
(plan Phase 4 environment note).

### Why `CYPRESS_BASE_URL` instead of editing `cypress.config.js`

The committed `baseUrl` (`http://laravel.local:8038`) is the developer's Sail
host and must stay put for local desktop runs. Cypress maps any `CYPRESS_*` env
var onto its config, so `CYPRESS_BASE_URL=http://127.0.0.1:8000` retargets the run
in CI without touching the committed file.

### Why `APP_URL` is rewritten to the serve host

Laravel generates asset URLs (the Vite tags) from `APP_URL`. Left at the
`.env.example` default of `http://localhost`, the built JS/CSS would be requested
from the wrong origin and fail in the browser — and without Livewire's JS the
profile-update intercept spec can't pass. Pointing `APP_URL` at
`http://127.0.0.1:8000` keeps asset URLs same-origin with the served app.

### Why a fresh SQLite file

A file (not `:memory:`) is required because `artisan serve` is a **separate
process** from the migrate step — an in-memory DB wouldn't be shared. Recreating
the file each run guarantees a clean, fully-migrated schema regardless of what a
checkout brings.

### Why an explicit `cypress install` step (the binary-cache gotcha)

The Cypress npm package and the Cypress **binary** are separate artifacts:
`pnpm install` places the package in `node_modules`, but the large binary is
downloaded by Cypress's post-install into a *global* cache, `~/.cache/Cypress` —
outside both `node_modules` and the pnpm store. `Setup Node`'s `cache: pnpm`
persists the **pnpm store** (keyed on the lockfile), which does **not** cover
`~/.cache/Cypress`. On a warm-store run, pnpm treats the package as already built
and skips its post-install, so the binary — never cached — is absent, and
`cypress run` fails with "the Cypress binary is missing." `package.json` already
authorizes the post-install (`pnpm.onlyBuiltDependencies: ["cypress"]`); the gap
is purely the CI cache boundary. The fix is a dedicated `pnpm exec cypress
install` step: it is idempotent (no-op when present, download when missing), so
the binary is guaranteed regardless of cache state. (A further optimization would
be to also cache `~/.cache/Cypress` keyed on the Cypress version; deferred, as
correctness comes first.)

### Why the test-only login route works in CI

`cy.login` POSTs to `/testing/login`, which registers only when the app isn't in
production. `.env.example` sets `APP_ENV=local`, so the route exists and
`User::factory()->create()` runs against the migrated SQLite DB.

### Separate workflow file

Kept apart from `tests.yml` (Pest): Cypress needs the app **served** and a
distinct setup (build, serve, wait). A separate `cypress` check also reads more
clearly in the PR status list.

## Verification

This commit verifies itself in CI: opening the PR against `13.x-livewire-8038`
should surface a new **`cypress`** check that boots the app and runs all five
specs headless to green. A genuinely broken spec turns the check red — the E2E
suite is now a merge gate.

## Follow-ups (later commits)

- Commit 14 — upload `cypress/screenshots`/`videos` as artifacts on failure.
- Commit 15 — `retries` in `cypress.config.js`.
