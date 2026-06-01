# 09 — Custom command `cy.login`

## Summary

Extracts the repeated authentication step — the `POST /testing/login` server
call introduced in commit 8 — into a reusable `cy.login` custom command, and
refactors `dashboard.cy.js` to use it. Future authenticated specs now share one
login path instead of duplicating the raw `cy.request`.

## Files

### `cypress/support/commands.js` (edit)

The boilerplate comments are replaced with the command definition:

```js
Cypress.Commands.add('login', () => {
  cy.request('POST', '/testing/login')
})
```

`cy.login` is a parent command (it starts its own chain rather than acting on a
subject). It wraps the env-gated `POST /testing/login` route from
`routes/testing.php`: the server factory-creates a **verified** user and logs
them in, and the session cookie rides back on the response. Cypress carries that
cookie into the next `cy.visit`.

### `cypress/e2e/dashboard.cy.js` (edit)

The raw request becomes the command:

```js
cy.viewport(1280, 800)
cy.login()
cy.visit('/dashboard')
```

Behaviour is unchanged — `cy.login` is a thin wrapper over the same HTTP call —
so no assertions move.

## Rationale

### Why wrap the server route, not a UI login

The original plan sketch (commit 9 in `00-cypress-plan.md`) anticipated
extracting a *UI* login. Commit 8 instead established auth through the test-only
`POST /testing/login` route, because Cypress runs on the desktop while the app
and DB live on the server — `cy.task()` into a local Node/Artisan process can't
reach the server database, so seeding has to go over HTTP. `cy.login` therefore
wraps that HTTP call. It's faster and less brittle than driving the login form,
and a separate spec (commit 6) already covers the real login UI.

### Why a parent command with no arguments

Today every authenticated spec wants the same thing: *some* verified user, logged
in. The command takes no arguments and lets the server factory pick the user
shape. If a future spec needs a specific user (a particular role, a known email),
the command can grow an options argument then — extracting it now, before that
need is real, would be speculative.

## Verification

Cypress runs on the desktop, pointed at the server via `baseUrl`:

```bash
pnpm exec cypress run --spec cypress/e2e/dashboard.cy.js
```

Expected: one test passes — `cy.login` authenticates, the dashboard renders, and
logout returns to `/`. A green run proves the extraction preserved behaviour.
