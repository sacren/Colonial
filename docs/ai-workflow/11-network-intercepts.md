# 11 — Network intercepts

## Summary

Adds `cypress/e2e/profile-update.cy.js`, the suite's first spec to use
`cy.intercept()`. It saves the profile settings form and waits on the **real
Livewire update request** before asserting success, demonstrating the intercept
as a deterministic synchronization gate.

## File added

`cypress/e2e/profile-update.cy.js`:

```js
cy.intercept('POST', /\/livewire-[0-9a-f]+\/update$/).as('livewireUpdate')

cy.login()
cy.visit('/settings/profile')

cy.get('input[wire\\:model=name]').clear()
cy.get('input[wire\\:model=name]').type('Renamed User')
cy.get('[data-test=update-profile-button]').click()

cy.wait('@livewireUpdate').its('response.statusCode').should('eq', 200)
cy.contains('Profile updated.').should('be.visible')
```

## Rationale

### Why intercept the Livewire request rather than the Fortify login

The login form is a classic synchronous form POST (`action="{{ route('login.store') }}"`),
so the interesting *asynchronous* traffic in this app is Livewire's. The profile
form (`resources/views/pages/settings/⚡profile.blade.php`) submits via
`wire:submit="updateProfileInformation"`, which fires an XHR to Livewire's update
endpoint and renders a success toast — a real async round-trip worth gating on.

### Why a regex for the endpoint, not a literal path

Livewire 4 serves its update endpoint under an app-specific, randomized prefix —
here `livewire-ed665f5d/update`. Hard-coding that prefix would make the spec
brittle: rotate the app key (or move to another environment) and the literal
match silently stops matching, so `cy.wait` would hang and time out. The regex
`/\/livewire-[0-9a-f]+\/update$/` pins the stable shape while staying agnostic to
the prefix, and is specific enough not to collide with any other `/update` route.

### Why `cy.wait('@livewireUpdate')` instead of asserting the toast directly

Asserting only `cy.contains('Profile updated.')` would lean on Cypress's retry
timeout to paper over the network round-trip — the kind of implicit timing that
turns into flake. Waiting on the aliased response is an explicit, deterministic
gate: the test proceeds the instant Livewire returns 200, no sooner and via no
arbitrary `cy.wait(ms)`. This is the intercept's real value, not just spying.

### Selector choice for the name field

The Flux name input carries no `name` or `data-test` attribute, but Flux forwards
`wire:model` onto the underlying `<input>`, so `input[wire\:model=name]` (colon
escaped for CSS) targets it via its actual data binding — a stable contract, not
a styling hook. The save button already ships `data-test=update-profile-button`.

### Scope boundary

The spec asserts the browser-observable result (update returns 200, toast shown).
Whether the `name` column actually changed is backend behavior, better covered by
a Pest feature test on the Livewire component.

## Verification

Cypress runs on the desktop against the server via `baseUrl`:

```bash
pnpm exec cypress run --spec cypress/e2e/profile-update.cy.js
```

Expected: one test passes — the profile saves, the Livewire update returns 200,
and the success toast renders.
