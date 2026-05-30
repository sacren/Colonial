# 05 — Welcome page navigation links

## Summary

Adds a second test case to `cypress/e2e/welcome.cy.js`, asserting that the welcome page's unauthenticated navigation links Log in to `/login` and Register to `/register`.

## File changed

`cypress/e2e/welcome.cy.js` — adds one `it` block inside the existing `describe('Welcome page', …)`:

```js
it('links Log in to /login and Register to /register', () => {
  cy.visit('/')
  cy.contains('a', 'Log in').should('have.attr', 'href').and('include', '/login')
  cy.contains('a', 'Register').should('have.attr', 'href').and('include', '/register')
})
```

Full file after the change:

```js
describe('Welcome page', () => {
  it('loads and shows the welcome heading', () => {
    cy.visit('/')
    cy.contains('h1', "Let's get started").should('be.visible')
  })

  it('links Log in to /login and Register to /register', () => {
    cy.visit('/')
    cy.contains('a', 'Log in').should('have.attr', 'href').and('include', '/login')
    cy.contains('a', 'Register').should('have.attr', 'href').and('include', '/register')
  })
})
```

## Rationale

### Why these assertions

- `resources/views/welcome.blade.php` renders an unauthenticated nav containing `<a href="{{ route('login') }}">Log in</a>` and `<a href="{{ route('register') }}">Register</a>`.
- Laravel's `route()` helper generates **absolute URLs by default** (per the official Laravel helpers documentation). The third parameter `$absolute` is `true` unless explicitly overridden. So `route('login')` evaluates to `http://<app.url>/login` (e.g., `http://laravel.local:8038/login` in local dev), not `/login`.
- The assertions therefore check that the `href` attribute **contains** `/login` and `/register` rather than matches a specific URL string. This decouples the test from any specific host: it works against `http://laravel.local:8038` locally, `http://localhost:8000` in CI (per the plan's Phase 4), and any production hostname.

### Why same file, same describe block

- Both tests cover the welcome page; they share a natural feature boundary.
- The describe block groups related test cases under one feature name in the Cypress runner UI.
- One spec per page is the project convention; splits only become necessary when a page accumulates enough tests to justify multiple files.

### Selector choice

- `cy.contains('a', 'Log in')` — text-finder scoped to the anchor tag. Preferred over class-based selectors that would couple the test to Tailwind utility classes (which can change in redesigns).

## Verification

Local headless run:

```bash
pnpm exec cypress run --spec cypress/e2e/welcome.cy.js
```

Expected: both tests pass; runtime well under one second.

Local interactive run:

```bash
pnpm exec cypress open
```

Pick `welcome.cy.js`; both tests appear in the command log with green checkmarks.
