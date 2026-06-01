# 08 — Authenticated dashboard

## Summary

Adds the first authenticated spec: a logged-in user can reach `/dashboard` and
sign out. Because Cypress has no native DB access — and, in this project, runs
on the desktop while the app and database run on the server — authentication is
established through a **test-only server route** that the browser calls over
HTTP.

## Files

### `routes/testing.php` (new)

```php
Route::post('/testing/login', function () {
    abort_unless(app()->environment('local', 'testing'), 404);

    $user = User::factory()->create();

    Auth::login($user);

    return response()->noContent();
});
```

- `User::factory()->create()` inserts a fresh user on the server. The factory's
  default state sets `email_verified_at = now()`, so the user is **verified**
  without any extra state — which matters because `/dashboard` sits behind the
  `verified` middleware.
- `Auth::login($user)` establishes the session; the `Set-Cookie` header rides
  back to Cypress.

### `bootstrap/app.php` (edit)

- **Conditional registration (production gate #1):** the testing routes are
  grouped under `web` middleware (for session + cookie handling) and registered
  **only when `! app()->isProduction()`**, via the `withRouting(then: ...)`
  closure. In production the route does not exist at all.
- **CSRF exception:** `validateCsrfTokens(except: ['testing/login'])`. The route
  needs `web` for the session, but a bare `cy.request` POST carries no CSRF
  token; without the exception it would return `419`.

The in-handler `abort_unless(...)` is production gate #2 — redundant with gate #1
by design, because this is an authentication-bypass endpoint.

### `cypress/e2e/dashboard.cy.js` (new)

```js
cy.request('POST', '/testing/login')
cy.visit('/dashboard')
cy.url().should('include', '/dashboard')
cy.get('[data-test=sidebar-menu-button]').should('be.visible')
cy.get('[data-test=sidebar-menu-button]').click()
cy.get('[data-test=logout-button]:visible').click()
cy.location('pathname').should('eq', '/')
```

## Rationale

### Why a server route rather than `cy.task()`

The canonical Cypress DB-seeding bridge is `cy.task()` into Node/Artisan. It does
not fit this project: `cy.task()` runs in Cypress's Node process on the
**desktop**, whereas the app and database live on the **server**. Seeding must
therefore go through the server over HTTP (`cy.request`), which is what the
test-only route provides.

### Why `:visible` on the logout button

The app layout (`layouts/app/sidebar.blade.php`) renders a `logout-button` in
**both** the desktop user menu (`hidden lg:block`) and the mobile header menu
(`lg:hidden`). At Cypress's default 1280px viewport the desktop menu is active
and the mobile one is hidden. Opening the user menu (`sidebar-menu-button`) and
clicking `[data-test=logout-button]:visible` targets exactly the one active
control, avoiding a multiple-elements error.

### Why assert `pathname === '/'` after logout

Laravel's logout redirects to the welcome page. Asserting the final pathname is
`/` is the user-observable proof that the session ended.

### Scope boundary

This spec proves the *browser journey* — authenticated user sees the app shell
and can sign out. It deliberately does not assert DB-level facts about the user
row; those belong in a Pest feature test.

## What this sets up for commit 9

`cy.login` (next commit) extracts `cy.request('POST', '/testing/login')` into a
reusable custom command, so this spec and future authenticated specs share one
login path.

## Verification

Cypress runs on the desktop against the server via `baseUrl`:

```bash
pnpm exec cypress run --spec cypress/e2e/dashboard.cy.js
```

Expected: one test passes — dashboard renders, logout returns to `/`.
