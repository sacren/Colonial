# AI-workflow docs

This directory holds artifacts from AI-collaborated work on this project's Cypress E2E test suite.

## Files

- `00-cypress-plan.md` — the phased build plan for the Cypress test suite. Canonical roadmap; updated as work progresses.
- `NN-<slug>.md` — per-commit handoff docs. Each captures the rationale, exact file contents, steps, and expected results for one commit, numbered with the commit's number prefix.

## Why this exists

Two reasons:

1. **Cross-session continuity.** An AI-assisted session can read these and pick up where a previous one left off, without losing context.
2. **External documentation.** The plan and handoff docs together provide a transparent record of the engineering process for anyone reading the repo.

## How to use in a new session

1. Read `00-cypress-plan.md` first to see where we are.
2. Run `git log --oneline -20` to confirm which commits have landed.
3. The next commit's number tells you which handoff doc (if any) describes it.
4. Confirm direction with the user before starting any work.
