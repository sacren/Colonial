# 03 — Welcome page smoke test

Commit: `Add welcome page smoke test` (`0230cd00c1cf`).

## Summary

The first Cypress E2E spec for this project. Exercises the welcome (`/`) page. Establishes that the full Cypress pipeline works end-to-end: `baseUrl` resolves, the view renders, assertions execute against rendered DOM.

## File added

`cypress/e2e/welcome.cy.js`:

```js
describe('Welcome page', () => {
  it('loads and shows the welcome heading', () => {
    cy.visit('/')
    cy.contains('h1', "Let's get started").should('be.visible')
  })
})
```

## Rationale

### Why this assertion target

- `routes/web.php` maps `/` to the `welcome` view.
- `resources/views/welcome.blade.php` contains an `<h1>` with the exact text `Let's get started`.
- The text is developer-written and stable — not auto-generated, unlikely to drift without intent.

### Why this shape

- One test, one assertion. Minimum needed to prove the full pipeline works.
- `describe('…', () => { … })` groups related tests by feature; subsequent commits add more welcome-page tests inside the same block (or a sibling file).
- `it('…', () => { … })` — single test case; the string completes "it…" naturally as a sentence.
- `cy.contains('h1', "Let's get started")` — text-finder scoped to a tag. Preferred over chained `cy.get('h1').contains(…)`: more concise, and Cypress retries the whole expression as one unit.
- `.should('be.visible')` — chained assertion with built-in retry; no `cy.wait` needed.

## Verification

Local headless run:

```bash
pnpm exec cypress run --spec cypress/e2e/welcome.cy.js
```

Expected: one passing test, runtime well under one second.

Local interactive run:

```bash
pnpm exec cypress open
```

Pick the spec from the Specs view; observe a green checkmark in the command log.
