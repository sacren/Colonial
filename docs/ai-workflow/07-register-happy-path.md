# 07 — Register happy path

## Summary

Adds `cypress/e2e/register.cy.js`, asserting that a valid submission on
`/register` creates an account and lands the user on an authenticated
destination.

## File added

`cypress/e2e/register.cy.js`:

```js
describe('Register happy path', () => {
  it('registers a new user and lands them on an authenticated page', () => {
    const email = `register-${Date.now()}@example.com`

    cy.visit('/register')

    cy.get('input[name=name]').type('Test User')
    cy.get('input[name=email]').type(email)
    cy.get('input[name=password]').type('Password123!')
    cy.get('input[name=password_confirmation]').type('Password123!')
    cy.get('[data-test=register-user-button]').click()

    cy.url().should('match', /\/(dashboard|verify-email)(\?|$)/)
  })
})
```

## Rationale

### The assertion respects what Cypress is for

Cypress is a black-box, browser-level tool: it asserts what a **user observes**,
not the app's internal configuration. The "happy path" success a user observes
is *being registered and landing authenticated in the app* — not a specific
internal redirect rule.

### Why the URL allow-list (`/dashboard` OR `/verify-email`)

This is the spec's robustness decision, and it maps to a real configuration
toggle in this app:

- `config/fortify.php` sets `'home' => '/dashboard'`, and the dashboard route
  (`routes/web.php`) sits behind `['auth', 'verified']` middleware.
- `Features::emailVerification()` is enabled in Fortify, **but** the `User`
  model does **not** implement `MustVerifyEmail` (the import is commented out in
  `app/Models/User.php`). The `verified` middleware only enforces verification
  for models implementing that interface, so today it is effectively a no-op:
  a freshly registered user lands on `/dashboard`.
- If someone later uncomments `MustVerifyEmail` on the `User` model, the **same**
  registration flow would redirect to `/verify-email` instead.

Both `/dashboard` and `/verify-email` are legitimate *authenticated*
destinations. Asserting the final URL matches **either** keeps the spec correct
across that toggle **without** the test reaching into PHP config — which it
cannot and should not do. A broken registration stays on `/register` and fails
the assertion, so the test still fails for the right reasons.

### Why a unique email per run

The server database persists between Cypress runs (Cypress drives the live app;
it has no native DB access to clean up). A hard-coded email would pass on the
first run, then fail on every rerun with "email already taken" — a
self-inflicted flake. `register-${Date.now()}@example.com` is unique per run, so
the spec is deterministic and rerunnable without any DB teardown.

### Selector choices

- `input[name=...]` — Flux inputs render real `<input>` elements carrying the
  `name` attributes the form POSTs by; stable contract attributes, not styling
  hooks.
- `[data-test=register-user-button]` — the submit button ships a dedicated
  `data-test` attribute, per Cypress's recommended best practice of targeting
  test attributes over text or CSS classes.

### Scope boundary (what this spec deliberately does NOT assert)

Whether the user row was persisted with the right attributes, or a verification
email was queued, is **backend** behavior — faster and more precisely covered by
a Pest feature test with DB/mail fakes. This Cypress spec proves only the
browser-level journey: a real user can complete the form and end up
authenticated.

## Verification

Cypress runs on the desktop, pointed at the server via `baseUrl`. Run from the
desktop:

```bash
pnpm exec cypress run --spec cypress/e2e/register.cy.js
```

Expected: one test passes. With the current `User` model (no `MustVerifyEmail`),
the run ends on `/dashboard`; the assertion also covers the `/verify-email`
outcome should that interface later be enabled.
