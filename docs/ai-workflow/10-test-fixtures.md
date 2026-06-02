# 10 — Test fixtures

## Summary

Introduces `cypress/fixtures/users.json` to hold the test user shapes the specs
had previously hard-coded, and refactors the `register` and `login` specs to load
them via `cy.fixture()`. One source of truth for "what a test user looks like."

## Files

### `cypress/fixtures/users.json` (new)

```json
{
  "registrant": {
    "name": "Test User",
    "password": "Password123!"
  },
  "invalid": {
    "email": "nobody@example.com",
    "password": "wrong-password"
  }
}
```

- `registrant` — the valid shape the register happy-path types into the form.
- `invalid` — the bad credentials the login error-path submits.

### `cypress/e2e/register.cy.js` (edit)

Loads the fixture in a `beforeEach` (`cy.fixture('users').as('users')`) and reads
`this.users.registrant` in the test. Name and password now come from the fixture;
the **email stays inline** because it must be unique per run
(`register-${Date.now()}@example.com`) — see the rationale below.

### `cypress/e2e/login.cy.js` (edit)

Same pattern: loads the fixture in `beforeEach`, reads `this.users.invalid` for
the bad email/password it submits.

## Rationale

### Why `.as()` + `this`, not inline `.then()`

`cy.fixture()` is async; its data isn't available synchronously. The two
documented ways to use it are an inline `cy.fixture('users').then(users => {...})`
wrapping the whole test, or aliasing with `.as('users')` in a `beforeEach` and
reading `this.users` in the test body. The alias pattern keeps the test body flat
(no extra callback nesting) and is Cypress's headline fixture example, so it's the
one used here.

### Why the `it` callback is `function () {}`, not an arrow

Mocha shares its context object (`this`) across `beforeEach` and the test, and
`.as('users')` attaches the loaded data to that context as `this.users`. Arrow
functions capture lexical `this` and would not see it, so the test callbacks are
written as `function () {}` on purpose. (`beforeEach` can stay an arrow — it only
*sets* the alias, it doesn't read `this`.)

### Why the registration email stays out of the fixture

The register spec needs a **unique** email per run, since the server DB persists
between runs and a fixed address would fail on the second run with "email already
taken." That value is computed (`Date.now()`), not static data, so it doesn't
belong in a fixture — only the stable `name`/`password` do.

### Why not fixture the dashboard spec

`dashboard.cy.js` authenticates through `cy.login()`, where the **server** factory
creates the user; the spec never types a user shape, so it has nothing to pull
from a fixture.

## Verification

Cypress runs on the desktop against the server via `baseUrl`:

```bash
pnpm exec cypress run --spec "cypress/e2e/{register,login}.cy.js"
```

Expected: both specs pass — behaviour is unchanged, the user data is just sourced
from the fixture now.
