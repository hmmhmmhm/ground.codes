# Production Incident Runbook

Use this runbook for a production-smoke failure, SLO alert, elevated API error
rate, or a bad Worker/Pages deployment.

## 0. Reproduce release artifacts without publishing

Production workflows and the root `.nvmrc` select Node.js 22. The remaining
release tools are pnpm 9.0.0, Bun 1.3.1, next-on-pages 1.13.16, Vercel CLI
47.0.4, and the repository-local Wrangler 4.110.0. Select Node.js 22 with your
version manager, then fail closed if the release toolchain does not match those
pins:

```sh
set -eu
test "$(tr -d '\n' < .nvmrc)" = "22"
test "$(node -p 'process.versions.node.split(".")[0]')" = "22"
test "$(pnpm --version)" = "9.0.0"
test "$(bun --version)" = "1.3.1"
test "$(pnpm --filter web exec next-on-pages --version)" = "1.13.16"
test "$(pnpm --filter web exec vercel --version)" = "47.0.4"
test "$(pnpm --filter grok-spiral exec vercel --version)" = "47.0.4"
test "$(pnpm exec wrangler --version)" = "4.110.0"
```

From a clean checkout, install twice and confirm both status commands print
nothing. This detects any manifest or lockfile mutation while proving the
second install is reproducible:

```sh
set -eu
git status --porcelain -- package.json pnpm-lock.yaml pnpm-workspace.yaml \
  ':(glob)**/package.json'
pnpm install --frozen-lockfile
pnpm install --frozen-lockfile
git status --porcelain -- package.json pnpm-lock.yaml pnpm-workspace.yaml \
  ':(glob)**/package.json'
```

Build the same release targets with lockfile-resolved tools. The Pages commands
must report `Vercel CLI 47.0.4` and `Completed pnpm exec vercel build`. Do not
substitute a global tool or use `npx`, `pnpm dlx`, or an unpinned `latest` tool:

```sh
set -eu
pnpm --filter web pages:build
pnpm --filter grok-spiral pages:build
pnpm --filter api-ground-codes build
WORKER_DRY_RUN_DIR="$(mktemp -d)"
trap 'rm -rf -- "$WORKER_DRY_RUN_DIR"' EXIT
pnpm exec wrangler deploy --dry-run \
  --config apps/api-ground-codes/wrangler.toml \
  --outdir "$WORKER_DRY_RUN_DIR"
rm -rf -- "$WORKER_DRY_RUN_DIR"
trap - EXIT
```

The Worker dry-run is local and does not require Cloudflare credentials. The
`--dry-run` flag on the first physical command line is the publication safety
boundary even when Wrangler authentication is configured. Its temporary output
directory is unique to the command and is removed on both success and failure.

For an additional lockfile proof, repeat the Pages builds with package fetching
disabled. Both commands must succeed from the frozen install:

```sh
set -eu
rm -rf -- apps/web/.next apps/web/.vercel/output
npm_config_offline=true pnpm --offline --filter web pages:build
rm -rf -- apps/web/.next apps/web/.vercel/output
rm -rf -- apps/grok-spiral/.next apps/grok-spiral/.vercel/output
npm_config_offline=true pnpm --offline --filter grok-spiral pages:build
rm -rf -- apps/grok-spiral/.next apps/grok-spiral/.vercel/output
```

The `pnpm exec wrangler deploy` command must report `--dry-run: exiting now.`
It bundles the Worker locally and does not publish a deployment.

## 1. Declare and contain

1. Open an [incident issue][new-incident]. Record the UTC start time, incident
   owner, affected objective, user impact, and links to the triggering signal.
2. Check the [Production Smoke history][smoke] and preserve the failed run's
   profile, check timings, logs, and commit. Do not paste request data into the
   issue.
3. Read [`/metrics`][metrics] and `/readyz`. Record `runtimeCommit`, service,
   scope, startup time, counters, and the observation time. `/metrics` is a
   single Worker-isolate snapshot, not globally aggregated history.
4. Pause further production changes until an owner chooses mitigation or
   rollback. Keep the incident issue current with decisions and timestamps.

## 2. Query Cloudflare observability

In Cloudflare Workers Observability, select the `api-ground-codes` Worker and
the incident window, then start with the exact structured-log filter:

```text
event = "api.request.completed"
```

This is the `event=api.request.completed` signal; use Cloudflare's field/value
filter controls if its query view does not accept the displayed syntax.

Narrow or group the result without inspecting request content:

- **Status family:** `status` is an exact three-digit string. Run one of these
  executable prefix expressions, then compare counts and rates:
  - `startsWith(status, "5")`
  - `startsWith(status, "4")`
  - `startsWith(status, "3")`
  - `startsWith(status, "2")`
  - `status = "5xx"` is invalid because no completion log has the literal
    status value `5xx`.
- **Route duration:** filter or group by the route template, for example
  `route = "/v1/encode"` or `route = "/v1/search"`, and sort `durationMs`
  descending. Use `durationMs >= 2000` to inspect objective misses.
- **Deployment:** filter `runtimeCommit` to the 40-character SHA reported by
  `/metrics`; compare it with the preceding known-good SHA.
- **Application shape:** the Worker calls `console.log(record)` with the
  `RequestCompletionLog` object rather than a pre-serialized JSON string. Its
  application payload fields are only `event`, `service`, `route`, `method`,
  `status`, `durationMs`, and `runtimeCommit`, so Cloudflare can index them.
  Cloudflare platform metadata may appear alongside that payload in the Logs
  event envelope; it is not emitted by the application and is not part of the
  seven-field privacy contract.

Logs must never include coordinates, search strings, ground codes, IP
addresses, headers, or credentials. Do not add these values to Cloudflare
queries, GitHub issues, screenshots, step summaries, or webhook messages.

## 3. Roll back to the last known-good SHA

1. Identify the last full [Production Smoke run][smoke] that passed before the
   incident. Verify its SHA against the applicable [API Worker][worker-history]
   or [Web Pages][web-history] deployment history; use the deployed artifact,
   not an unverified local build.
2. Before an API rollback, account for external state: Worker rollback does
   not roll back PostGIS, R2, or other external state. Verify that the older
   code is compatible with the current schema and data, including current R2
   object formats. If compatibility cannot be demonstrated, use a forward fix
   or documented data recovery instead of rolling back code alone.
3. For an API incident, find the Worker version tagged with the last known-good
   SHA, then run the repository-local [Wrangler rollback][worker-rollback]. Use
   the Cloudflare Workers Deployments view to select it; do not export or attach
   the full deployment object to the incident. Record only the version ID,
   tag/SHA, and deployment status. The rollback command changes production
   immediately, so only the incident owner should run it after completing the
   compatibility check above:

   ```sh
   set -eu
   set +x
   : "${CLOUDFLARE_API_TOKEN:?set a scoped token from the secret store}"
   : "${KNOWN_GOOD_SHA:?set the verified 40-character SHA}"
   : "${WORKER_VERSION_ID:?set the verified known-good version ID}"
   pnpm exec wrangler rollback "$WORKER_VERSION_ID" \
     --config apps/api-ground-codes/wrangler.toml \
     --message "Incident rollback to $KNOWN_GOOD_SHA"
   ```

   Confirm `/readyz` and `/metrics` report the known-good API `runtimeCommit`,
   then run the manual full [Production Smoke workflow][smoke]:

   ```sh
   set -eu
   curl --fail --silent --show-error https://api.ground.codes/readyz
   curl --fail --silent --show-error https://api.ground.codes/metrics
   gh workflow run production-smoke.yml --ref main \
     -f profile=full \
     -f force_failure=false
   ```

4. For a Web or Grok Spiral incident, record the selected Pages deployment ID
   and commit. Wrangler 4.110.0 can list Pages deployments but does not expose a
   Pages rollback subcommand, so use the authenticated
   [Pages rollback API][pages-rollback-api]. Set `PAGES_PROJECT` to
   `ground-codes` for Web or
   `grok-spiral` for Grok Spiral. Only a successful production deployment is a
   valid target. Use the Cloudflare Pages Deployments view to find it; do not
   export or attach the full deployment object to the incident. Record only the
   deployment ID, status, and commit:

   ```sh
   set -eu
   set +x
   : "${CLOUDFLARE_ACCOUNT_ID:?set the Cloudflare account ID}"
   : "${CLOUDFLARE_API_TOKEN:?set a Pages Write token from the secret store}"
   : "${PAGES_PROJECT:?set ground-codes or grok-spiral}"
   : "${PAGES_DEPLOYMENT_ID:?set the verified known-good deployment ID}"
   curl --silent --show-error --fail-with-body --output /dev/null \
     --request POST \
     "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PAGES_PROJECT}/deployments/${PAGES_DEPLOYMENT_ID}/rollback" \
     --header "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
   ```

   Verify that deployment ID is active in Pages history. For Web, fetch a fresh
   `https://ground.codes/` response and run a full production smoke. For Grok
   Spiral, fetch `https://grok-spiral.ground.codes/` and use its separate Pages
   history. `/metrics.runtimeCommit` identifies only the API Worker and is not
   evidence of either active Pages deployment.

5. If the platform rollback cannot be used, revert the bad change on `main`
   with a normal reviewed commit and let the relevant deployment workflow
   publish it. Never force-push or move `main` to the old SHA.
6. Record the bad SHA, known-good SHA, deployment/run URLs, operator, and UTC
   timestamps in the incident issue.

## 4. Validate and close

Keep the issue open until user impact has stopped, readiness and Web-root
checks are healthy, and Cloudflare filters show no continuing error spike. For
an API incident, verify the active `runtimeCommit`; for a Web incident, verify
the active Pages deployment ID and commit plus a fresh Web response. A full
post-deploy production smoke must pass before closure; link that run in the
issue. Record the error-budget impact, root cause, follow-up owner, and due date
before closing.

[new-incident]: https://github.com/hmmhmmhm/ground.codes/issues/new?labels=incident&title=Production%20incident%3A%20
[smoke]: https://github.com/hmmhmmhm/ground.codes/actions/workflows/production-smoke.yml
[worker-history]: https://github.com/hmmhmmhm/ground.codes/actions/workflows/deploy-api.yml
[web-history]: https://github.com/hmmhmmhm/ground.codes/actions/workflows/deploy-web.yml
[grok-history]: https://github.com/hmmhmmhm/ground.codes/actions/workflows/deploy-grok-spiral.yml
[metrics]: https://api.ground.codes/metrics
[worker-rollback]: https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/
[pages-rollback-api]: https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/rollback/
