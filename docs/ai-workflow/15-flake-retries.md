# 15 — Flake retries

## Summary

Adds a test-retry policy to `cypress.config.js`: retry a failed test up to twice
in CI, and never retry during interactive local development. This absorbs genuine
non-determinism in CI without hiding flake from the author who is best placed to
fix it.

## File

### `cypress.config.js` (edit)

```js
retries: {
  runMode: 2,   // `cypress run` (CI): up to 2 retries
  openMode: 0,  // `cypress open` (local dev): no retries
},
```

## Rationale

### Why `runMode: 2` / `openMode: 0`

The two modes have opposite goals:

- **`runMode` (CI, `cypress run`):** a transient hiccup — a slow Livewire
  round-trip, a one-off network blip — shouldn't fail the whole pipeline and block
  a merge. Two retries let a truly flaky test settle while still failing a test
  that's *consistently* broken (a real bug fails all three attempts).
- **`openMode` (local, `cypress open`):** while authoring, you *want* to see a
  flake the instant it happens, so you can diagnose it. Retrying locally would
  mask the very signal you're debugging. Hence zero retries there.

This split is Cypress's documented recommendation, and it keeps retries from
becoming a blanket "make red go green" lever.

### Standing rule 7 — no flake was manufactured

The plan's standing rule 7 says: fix and document a real flake *if one surfaced*
during commits 12–14, and do **not** manufacture one if it didn't. None did. The
two CI failures we hit were both **deterministic, not flaky**, and were
root-caused rather than retried away:

- Commit 12 — Pint `single_blank_line_at_eof` drift (a real style violation).
- Commit 13 — the Cypress binary missing because `~/.cache/Cypress` sat outside
  the pnpm-store cache.

Both failed every time until fixed properly. Retries would have done nothing for
them — and that's the point: this config is a **defensive default** for future
genuine flake, not a patch over a known bug. If a real flake appears later, the
correct response is still to root-cause it (and document the find-and-fix), not to
lean on the retry count.

## Documentation note

The plan also calls for the retry policy to live in `cypress/README.md` — but that
file isn't created until Phase 5 (commit 17). The policy is captured here for now;
commit 17 will carry it into `cypress/README.md` alongside the rest of the suite's
conventions.

## Verification

Config-only change; the suite still runs green. The retry behavior itself is only
observable when a test actually fails intermittently in CI — at which point the
run log shows the per-attempt retries before a final pass or fail.
