# 06 — Login error path

## Summary

Adds `cypress/e2e/login.cy.js`, a new spec asserting that submitting invalid
credentials on `/login` renders the expected authentication error message.

## File added

`cypress/e2e/login.cy.js`:

```js
describe('Login error path', () => {
  it('shows an error when credentials are invalid', () => {
    cy.visit('/login')

    cy.get('input[name=email]').type('nobody@example.com')
    cy.get('input[name=password]').type('wrong-password')
    cy.get('[data-test=login-button]').click()

    cy.contains('These credentials do not match our records.').should('be.visible')
  })
})
```

## Rationale

### Why no DB seeding

- Bad credentials are bad whether or not a matching user exists. Fortify's
  login action attempts authentication and, on failure, throws a
  `ValidationException` keyed to the `email` field — independent of database
  state. The spec therefore needs no factory, seeder, or login fixture.

### Why this error message

- `resources/views/pages/auth/login.blade.php` is a standard POST form to
  `route('login.store')`; Fortify handles the request.
- The project publishes no `lang/en/auth.php`, so the message is Laravel's
  framework default for `auth.failed`: **"These credentials do not match our
  records."**
- Fortify attaches this message to the `email` field. The Flux `<flux:input
  name="email">` component renders its field error automatically, so the text
  appears on the page after the redirect-back.

### Selector choices

- `input[name=email]` / `input[name=password]` — Flux inputs render real
  `<input>` elements carrying the `name` attributes declared in the Blade. These
  are stable contract attributes (the form POSTs by `name`), not styling hooks.
- `[data-test=login-button]` — the submit button already ships a `data-test`
  attribute in the Blade. Using it follows Cypress's recommended best practice
  of targeting dedicated test attributes over text or CSS classes, which decouples
  the test from copy changes and Tailwind utility churn.
- `cy.contains('These credentials do not match our records.')` — asserts on the
  user-visible message rather than an internal error-bag selector, so the test
  verifies what a real user would actually see.

### Why a new file (not appended to welcome.cy.js)

- One spec per page/feature is the project convention. The welcome page and the
  login flow are distinct features, so the login error path gets its own
  `login.cy.js`.

## Verification

Cypress runs on the desktop, pointed at the server via `baseUrl`
(`http://laravel.local:8038`). Run from the desktop:

```bash
pnpm exec cypress run --spec cypress/e2e/login.cy.js
```

Expected: one test passes. The run visits `/login`, submits the bad
credentials, and confirms the failure message is visible after Fortify redirects
back.

Interactive:

```bash
pnpm exec cypress open
```

Pick `login.cy.js`; the single test shows a green checkmark in the command log.
