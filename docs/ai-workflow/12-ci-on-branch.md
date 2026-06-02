# 12 — Wire existing CI onto the project branch

## Summary

Phase 4 opens not by adding CI, but by fixing CI that already existed and never
ran for us. The repo ships two starter-kit workflows — `lint.yml` (Pint) and
`tests.yml` (Pest) — that triggered only on `develop`/`main`/`master`/`workos`,
so no PR in this effort had ever been checked. This commit points both at
`13.x-livewire-8038` and makes the lint job **fail** on style violations instead
of silently fixing them.

## Why this replaces the original commit 12

The original plan said "add `.github/workflows/ci.yml` running `pint --test`."
With `lint.yml` already running Pint, that new file would have been redundant. The
**real** gaps were:

1. Neither workflow triggered on this branch or its PRs — CI was effectively off.
2. `lint.yml` ran `composer lint` (`pint --parallel`, the **fixer**), which mutates
   files and exits 0 even when it changed something — so it could never fail a
   build on bad style. A lint check that can't fail isn't a check.

Fixing those is the genuine "scaffold," and it proves the runner works on our
branch flow before commit 13 adds Cypress.

## Files

### `.github/workflows/lint.yml` (edit)

- Added `13.x-livewire-8038` to the `push` and `pull_request` branch filters.
- Changed the step from `composer lint` → `composer lint:check`
  (`pint --parallel --test`): no file mutation, **non-zero exit on violations**.
- Renamed the step `Run Pint` → `Check code style` to match the new intent.
- Removed the commented-out `git-auto-commit-action` block (it only made sense
  paired with the fixer) and dropped `permissions: contents: write` to
  `contents: read` — the job no longer writes to the repo, so least privilege.

### `.github/workflows/tests.yml` (edit)

- Added `13.x-livewire-8038` to the `push` and `pull_request` branch filters so
  the existing Pest matrix (PHP 8.3/8.4/8.5) runs on our PRs too. No other change.

## Notes

- `pull_request.branches` filters on the PR's **base** branch. Our feature PRs
  target `13.x-livewire-8038`, so adding it there is what makes the checks run on
  those PRs.
- **Deferred cleanup (not in this commit):** `lint.yml` still runs `npm install`,
  which Pint doesn't need, and uses npm while the project is pnpm. Left alone to
  keep this commit scoped to triggers + fail-closed; worth tidying later.

## Organic PR review captured here

Per standing rule 6, this commit is where a real review finding lands rather than
a manufactured one (the conditional commit 18): the planned `ci.yml` was redundant
with `lint.yml`, and no workflow targeted our branch. That discovery — surfaced
while starting Phase 4 — reshaped commits 12 and 13 (see the plan revision in
`00-cypress-plan.md`). Recording it in this PR's description is the review
artifact.

## Verification

This is the first commit whose verification *is* CI itself: once pushed and a PR
is opened against `13.x-livewire-8038`, both the `linter` and `tests` checks
should appear and run on the PR — where before they did not. A deliberate style
violation should now turn the lint check red (previously it would have passed).
