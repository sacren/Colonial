# 17 — Cypress suite README

## Summary

Adds `cypress/README.md`, the operational guide for the E2E suite: layout, spec
naming, the selector preference order the specs follow, the custom-command index,
how to run locally and in CI, how to debug a failure, and the retry policy. It is
the "how to work in this suite" companion to `docs/ai-workflow/`, which holds the
per-commit *why*.

## File added

`cypress/README.md` — sections:

- **Layout / specs table** — the directory shape and what each of the five specs
  covers.
- **Naming** — one spec per feature; `describe` = feature, `it` = user-observable
  behaviour.
- **Selector preference order** — `data-test` → functional attributes
  (`name`, `wire:model`) → visible text → avoid CSS/structure. This codifies what
  the specs already do rather than inventing a new rule.
- **Custom commands** — `cy.login()` and why it uses the test-only route.
- **Running locally / in CI** — the desktop `baseUrl` vs the CI
  `CYPRESS_BASE_URL` override.
- **Debugging a failure** — local screenshots, CI artifacts (commit 14), Slack
  link (commit 16).
- **Retry policy** — `runMode: 2 / openMode: 0`, carried here from commit 15.

## Rationale

### Why a separate `cypress/README.md` (not more in `docs/ai-workflow/`)

The two serve different readers. `docs/ai-workflow/` is a chronological record of
*why each commit was made* — narrative, per-commit. `cypress/README.md` is a
*reference* for someone working in the suite right now: where things are, how to
run them, what conventions to follow. A contributor shouldn't have to read 17
handoff docs to learn the selector order. They cross-link.

### Why it documents existing conventions rather than new ones

Everything in the README is already true of the suite — the selector order, the
naming, `cy.login`, the retry config. Writing it down makes the implicit explicit
so the next spec stays consistent; it deliberately introduces no new behaviour.

### Fulfils the deferred retry-policy doc

Commit 15 added the retry config and noted its documentation "belongs in
`cypress/README.md`, created in Phase 5." This commit is where that lands — the
README's Retry policy section is that promised home.

## Verification

Docs-only; no code or CI behaviour changes. The check is editorial: every claim
matches the repo (spec list, command name, config values, workflow file paths)
and the relative links resolve (`../docs/ai-workflow/`).
