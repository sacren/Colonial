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
cy.viewport(1280, 800)
cy.request('POST', '/testing/login')
cy.visit('/dashboard')
cy.url().should('include', '/dashboard')
cy.contains('Platform').should('be.visible')
cy.get('[data-test=sidebar-menu-button]').click()
cy.get('[data-test=logout-button]:visible').click()
cy.location('pathname').should('eq', '/')
```

> **Updated in commit 9:** the `cy.request('POST', '/testing/login')` call above
> is now `cy.login()` (see [09-cy-login-command.md](09-cy-login-command.md)). The
> explicit `cy.viewport(1280, 800)` was added to force a desktop layout — see the
> viewport note below.

## Rationale

### Why a server route rather than `cy.task()`

The canonical Cypress DB-seeding bridge is `cy.task()` into Node/Artisan. It does
not fit this project: `cy.task()` runs in Cypress's Node process on the
**desktop**, whereas the app and database live on the **server**. Seeding must
therefore go through the server over HTTP (`cy.request`), which is what the
test-only route provides.

### Why force a 1280px viewport

Cypress's **default viewport is 1000×660** — and 1000px is just below Tailwind's
`lg` breakpoint (1024px), where this app collapses the sidebar off-canvas and
`[data-test=sidebar-menu-button]` becomes unreachable. The spec calls
`cy.viewport(1280, 800)` to force a desktop layout where the user menu is active.
(An earlier draft of this doc mistakenly claimed Cypress defaults to 1280px; it
does not, which is exactly why the explicit `cy.viewport` is required.)

### Why `:visible` on the logout button

The app layout (`layouts/app/sidebar.blade.php`) renders a `logout-button` in
**both** the desktop user menu (`hidden lg:block`) and the mobile header menu
(`lg:hidden`). At the forced 1280px viewport the desktop menu is active and the
mobile one is hidden. Opening the user menu (`sidebar-menu-button`) and clicking
`[data-test=logout-button]:visible` targets exactly the one active control,
avoiding a multiple-elements error.

### Why assert `pathname === '/'` after logout

Laravel's logout redirects to the welcome page. Asserting the final pathname is
`/` is the user-observable proof that the session ended.

### Scope boundary

This spec proves the *browser journey* — authenticated user sees the app shell
and can sign out. It deliberately does not assert DB-level facts about the user
row; those belong in a Pest feature test.

## What this set up for commit 9

Commit 9 extracted `cy.request('POST', '/testing/login')` into the reusable
`cy.login` custom command, so this spec and future authenticated specs share one
login path. See [09-cy-login-command.md](09-cy-login-command.md).

## Verification

Cypress runs on the desktop against the server via `baseUrl`:

```bash
pnpm exec cypress run --spec cypress/e2e/dashboard.cy.js
```

Expected: one test passes — dashboard renders, logout returns to `/`.
