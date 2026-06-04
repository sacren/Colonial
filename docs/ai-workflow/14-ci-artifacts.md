# 14 — Artifacts on failure

## Summary

When the CI Cypress run fails, the logs alone rarely show *why* a browser test
broke. This commit makes the job upload Cypress's **screenshots and videos as
workflow artifacts on failure**, so a failed run is debuggable from the GitHub UI
without reproducing it locally.

## Files

### `.github/workflows/cypress.yml` (edit)

- Added `CYPRESS_VIDEO: true` to the `Run Cypress` step's env. Cypress 13+ records
  no video by default; this enables it **for CI only** (via the env override)
  without changing the committed `cypress.config.js`, so local desktop runs stay
  video-free and fast.
- Added two `actions/upload-artifact@v4` steps, each guarded by `if: failure()`:
  - `cypress-screenshots` ← `cypress/screenshots`
  - `cypress-videos` ← `cypress/videos`
  Both use `if-no-files-found: ignore` so the steps never error if a directory is
  empty.

## Rationale

### Why `if: failure()`

The artifacts only matter when something broke, and uploading on every green run
is wasted storage and time. `if: failure()` runs the upload steps only when an
earlier step (the Cypress run) failed — exactly the runs worth inspecting.

### Why enable video via env, not `cypress.config.js`

Video can't be captured retroactively — Cypress must record during the run. But
recording on every *local* run slows the desktop workflow for no benefit there.
Setting `CYPRESS_VIDEO: true` only in the CI step records video in CI while
leaving the committed config's default (off) untouched. Screenshots need no such
toggle: Cypress captures them on test failure automatically.

### Why two separate artifacts

Screenshots (a single failing frame) and videos (the whole spec run) serve
different debugging needs and differ a lot in size. Separate named artifacts let
a reviewer grab just the small screenshot first and only download the heavier
video if needed.

### Already gitignored

`/cypress/screenshots` and `/cypress/videos` are in `.gitignore`, so these
CI-generated files can never be accidentally committed; they exist only as
ephemeral run output that this commit ferries to the artifacts store.

## Verification

This can't be proven by a green run — it only acts on failure. To confirm it
works, a deliberately failing spec (or a transient real failure) should produce a
red `cypress` check whose summary page lists `cypress-screenshots` and
`cypress-videos` artifacts for download. On green runs, no artifacts upload, by
design.
