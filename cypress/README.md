# Cypress E2E suite

End-to-end tests for this Laravel 13 / Livewire 4 app, run with
[Cypress](https://www.cypress.io/) (`^15`). This README is the operational guide;
the per-commit *why* lives in [`docs/ai-workflow/`](../docs/ai-workflow/).

## Layout

```
cypress/
  e2e/             # specs, one file per feature, *.cy.js
  fixtures/        # static test data (users.json)
  support/
    commands.js    # custom commands (cy.login)
    e2e.js         # loaded before every spec
```

Current specs:

| Spec | Covers |
| --- | --- |
| `welcome.cy.js` | Welcome page loads; Log in / Register links |
| `login.cy.js` | Login error path (invalid credentials) |
| `register.cy.js` | Register happy path → authenticated redirect |
| `dashboard.cy.js` | Authenticated dashboard renders + sign-out |
| `profile-update.cy.js` | Profile save, gated on the Livewire update via `cy.intercept` |

## Naming

- One spec per feature, named after the feature: `login.cy.js`, `register.cy.js`.
- `describe()` names the feature; `it()` states the user-observable behaviour
  ("shows an error when credentials are invalid").

## Selector preference order

Target stable contracts, not styling. In order of preference:

1. **`data-test` attributes** — `cy.get('[data-test=login-button]')`. The first
   choice; these exist to be tested against.
2. **Functional attributes the app depends on** — form field names
   (`input[name=email]`) and Livewire bindings (`input[wire\:model=name]`, the
   colon escaped). Stable because the app's behaviour relies on them.
3. **User-visible text** — `cy.contains('h1', "Let's get started")` for headings
   or link text when no attribute fits.
4. **Avoid** CSS classes, Tailwind utilities, and DOM-structure selectors — they
   change with styling and make specs brittle.

## Custom commands

| Command | Purpose |
| --- | --- |
| `cy.login()` | Authenticate as a fresh, **verified** user via the env-gated `POST /testing/login` route (`routes/testing.php`). The server factory-creates the user and sets the session cookie; Cypress carries it into the next `cy.visit`. Used instead of driving the login form because Cypress runs on the desktop while the app/DB run on the server, so `cy.task()` can't reach the database. |

## Running locally

Cypress runs on your machine against the running app (`baseUrl` in
`cypress.config.js` is the Sail dev host, `http://laravel.local:8038`).

Prerequisites: the app and Vite dev server running (the usual Sail dev setup).

```bash
pnpm exec cypress open                              # interactive runner
pnpm exec cypress run                               # headless, all specs
pnpm exec cypress run --spec cypress/e2e/login.cy.js   # one spec
```

## Running in CI

`.github/workflows/cypress.yml` runs the suite headless on every push / PR to
`13.x-livewire-8038`. It uses native PHP + Node (no Sail), a fresh SQLite DB,
serves the app with `php artisan serve` on `127.0.0.1:8000`, and overrides the
base URL with `CYPRESS_BASE_URL` — the committed `baseUrl` is never edited for CI.

## Debugging a failure

- **Locally:** `pnpm exec cypress open` and watch the run; on failure Cypress
  writes a screenshot to `cypress/screenshots/`.
- **In CI:** a failed run uploads **`cypress-screenshots`** and **`cypress-videos`**
  artifacts (see the run summary page), and posts a link to the run in Slack if a
  `SLACK_WEBHOOK_URL` secret is configured. Video is recorded in CI only.

## Retry policy

`cypress.config.js` sets:

```js
retries: { runMode: 2, openMode: 0 }
```

- **`cypress run` (CI): up to 2 retries** — absorb genuine flake so a transient
  hiccup doesn't block a merge; a consistently broken test still fails all
  attempts.
- **`cypress open` (local): no retries** — a flake should surface immediately
  while you're authoring, not be hidden.

Retries are a safety net for *non-determinism*, not a way to paper over a real
bug. If a spec fails repeatably, find the root cause.

## More

Build plan and per-commit rationale: [`docs/ai-workflow/`](../docs/ai-workflow/).
