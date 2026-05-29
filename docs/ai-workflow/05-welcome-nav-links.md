# 05 — Welcome page navigation links

## Summary

Adds a second test case to `cypress/e2e/welcome.cy.js`, asserting that the welcome page's unauthenticated navigation links Log in to `/login` and Register to `/register`.

## File changed

`cypress/e2e/welcome.cy.js` — adds one `it` block inside the existing `describe('Welcome page', …)`:

```js
it('links Log in to /login and Register to /register', () => {
  cy.visit('/')
  cy.contains('a', 'Log in').should('have.attr', 'href', '/login')
  cy.contains('a', 'Register').should('have.attr', 'href', '/register')
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
    cy.contains('a', 'Log in').should('have.attr', 'href', '/login')
    cy.contains('a', 'Register').should('have.attr', 'href', '/register')
  })
})
```

## Rationale

### Why these assertions

- `resources/views/welcome.blade.php` renders an unauthenticated nav containing `<a href="{{ route('login') }}">Log in</a>` and `<a href="{{ route('register') }}">Register</a>`.
- `config/fortify.php` sets `'prefix' => ''` and enables `Features::registration()`, so `route('login')` resolves to `/login` and `route('register')` resolves to `/register`.
- The assertions verify both that the links exist (`cy.contains('a', '<text>')`) and that they point to the expected URLs (`.should('have.attr', 'href', '<path>')`).

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
