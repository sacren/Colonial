# 16 — Failure notification

## Summary

Closes Phase 4: when the CI Cypress run fails, post a message to Slack so the team
hears about a red pipeline without watching the Actions tab. Artifacts (commit 14)
make a failure *debuggable*; this makes it *noticed*.

## Files

### `.github/workflows/cypress.yml` (edit)

- Added a job-level `env: SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}`.
- Added a final `Notify Slack on failure` step using
  `slackapi/slack-github-action@v2` (incoming-webhook mode), posting the branch
  and a direct link to the failed run.

The notification requires a `SLACK_WEBHOOK_URL` repo secret (a Slack Incoming
Webhook URL). It is not committed — only its name is referenced.

## Rationale

### Why the `if: failure() && env.SLACK_WEBHOOK_URL != ''` guard

Two conditions, both necessary:

- **`failure()`** — only ping on a red run; nobody wants a Slack message per green
  build.
- **`env.SLACK_WEBHOOK_URL != ''`** — skip cleanly when the secret isn't
  configured. Without this, a repo (or a fork) lacking the secret would try to
  post to an empty webhook and turn the *notify* step itself red, converting a
  missing-secret into a spurious CI failure. With the guard, no secret simply
  means no notification.

### Why surface the secret as a job-level `env`

GitHub does **not** expose the `secrets` context inside a step's `if:`
expression, so `if: secrets.SLACK_WEBHOOK_URL != ''` cannot work. Mapping the
secret to a job-level `env` makes its presence testable via
`env.SLACK_WEBHOOK_URL != ''`. The actual value is still passed to the action
through `secrets.SLACK_WEBHOOK_URL`, not the env.

### Why Slack (and how to switch)

Chosen per the maintainer's platform. Discord (or any service) would be the same
shape: a `failure()`-guarded final step posting to a `*_WEBHOOK_URL` secret —
swap the action/`curl` and the secret name.

### Why a link to the run, not just "it failed"

The payload embeds `…/actions/runs/${{ github.run_id }}` so the message is
actionable in one click — straight to the failed run, where the commit-14
screenshots/videos are attached.

## Verification

Only observable on a red run with the secret set: a failing `cypress` check then
drops a Slack message linking back to it. On green runs, or when the secret is
absent, the step is skipped — by design. Setup needed before it can fire: add the
`SLACK_WEBHOOK_URL` repo secret (Settings → Secrets and variables → Actions).
