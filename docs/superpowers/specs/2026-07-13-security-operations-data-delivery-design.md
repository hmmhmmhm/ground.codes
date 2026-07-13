# Security, Operations, and Data Delivery Hardening Design

**Date:** 2026-07-13

## 1. Objective

Complete the next hardening cycle for `ground.codes` without weakening the
behavior validated by PR #66. The work must:

- remove known high-severity production dependency advisories;
- fix invalid Worker-isolate start time and uptime metrics;
- enable repository security controls and protect `main`;
- reduce recurring production-smoke checkout and runner cost;
- make production deployments reproducible and serialization-safe;
- add enforceable test-coverage gates for critical maintained code;
- move the 8.35 GiB region dataset out of the current Git tree and into
  versioned Cloudflare R2 objects without rewriting Git history; and
- finish with green CI, deployments, and post-deploy production smoke on the
  merged `main` commit.

This is a staged program, not one indivisible change. Each stage must be
independently reversible and must leave production healthy.

## 2. Current-State Evidence

The design responds to observed state on merged commit
`827847ddf42f5432f104b40eaf3ec9791d5e0581`:

- `pnpm audit --prod` reports 4 high, 14 moderate, and 3 low advisories.
  Direct runtime dependencies include Elysia 1.2.25, `@elysiajs/cors` 1.2.0,
  and next-intl 4.0.2.
- `https://api.ground.codes/metrics` reports
  `startedAt: "1970-01-01T00:00:00.000Z"` and an uptime of roughly 56 years.
- The repository has no branch protection or repository rulesets. Dependabot
  security updates, secret scanning, and push protection are disabled.
- `MOSHI_WEBHOOK_TOKEN` is absent from GitHub Actions secrets, so smoke
  failures fall back to issue comments instead of push notification.
- the scheduled production smoke checks out the full repository. A recent run
  spent 58 seconds checking out the repository and 49 seconds executing the
  smoke checks.
- `packages/geoint/region-dist` contains 901 files totaling 7.56 GiB and
  `packages/geoint/region-db` contains 1,130 files totaling 0.79 GiB.
- Web and Grok Spiral deployments have no concurrency group. Wrangler and Bun
  are installed from moving `latest` references.
- The repository has 58 test files but no code-coverage command or threshold.

## 3. Delivery Strategy

Use four ordered delivery stages:

1. **Security and repository governance**
2. **Metrics, smoke, and observability**
3. **CI, deployment reproducibility, and coverage**
4. **R2 data publication and Git-tree cutover**

The stages may live on one long-running feature branch, but commits and pull
request descriptions must preserve these boundaries. Security and the metrics
bug are completed before the longer data migration.

## 4. Security and Repository Governance

### 4.1 Dependency remediation

- Replace moving runtime dependency specifications such as `"latest"` with
  reviewed explicit versions.
- Upgrade Elysia to at least 1.4.27 and use compatible current releases of the
  Elysia CORS, static, and Swagger plugins.
- Upgrade next-intl to at least 4.9.2.
- Upgrade Cesium or apply reviewed lockfile overrides so its protobufjs and
  DOMPurify dependency graph has no known high-severity advisory.
- Patch or override picomatch and PostCSS to fixed release lines.
- Keep the frozen lockfile authoritative in every CI and deploy workflow.
- Add `pnpm audit --prod --audit-level high` to CI. Completion requires zero
  critical and zero high advisories. Moderate advisories must either be fixed
  or documented with applicability and a follow-up issue.

Dependency upgrades are separated into compatible groups and tested after each
group. Major framework upgrades such as Next 16, React 19.2, TypeScript 7, or
ESLint 10 are not required unless needed to remove a security advisory.

### 4.2 Automated security maintenance

- Add `.github/dependabot.yml` for weekly grouped npm and GitHub Actions
  updates.
- Enable Dependabot security updates.
- Enable secret scanning, non-provider pattern scanning, validity checks, and
  push protection where GitHub exposes them for the public repository.
- Pin GitHub Actions to full commit SHAs with an adjacent release comment.
- Store `MOSHI_WEBHOOK_TOKEN` as an Actions secret through stdin; never place
  the value in a file, command output, workflow, commit, or pull request.

### 4.3 Main-branch rules

After the feature PR has a stable required check name, create an active
repository ruleset for `main` that:

- requires changes to arrive through a pull request;
- requires the `verify` CI status check;
- requires branches to be up to date before merge;
- blocks force pushes and branch deletion;
- does not require another human approval, because this is currently a solo
  repository; and
- permits administrator bypass only for an emergency recovery.

Enable automatic deletion of merged head branches. Capture the resulting
ruleset ID and settings in the final verification report.

## 5. Metrics and Observability

### 5.1 Worker start-time fix

Cloudflare may evaluate wall-clock time at module initialization as the Unix
epoch. The metrics module therefore stores no eager `new Date()` value.

- Keep `startedAt` unset until the first incoming request reaches `onRequest`.
- Initialize it once from request-time wall-clock state.
- Serialize a valid ISO timestamp and calculate non-negative uptime from the
  same initialized value.
- Keep the current Worker-isolate scope explicit. Empty route/path counters
  remain valid because the metrics request can reach a fresh isolate.

### 5.2 Metrics contract validation

Production smoke and unit tests validate:

- `startedAt` is a valid ISO timestamp later than 2020-01-01;
- it is not materially in the future;
- `uptimeSeconds` agrees with `startedAt` within a small clock/rounding
  tolerance;
- top-level totals and every present route, status, and path counter are finite
  non-negative numbers; and
- the service name, scope, and deployed commit remain observable.

### 5.3 Structured operational signals

- Emit one structured JSON record for API request completion containing route,
  method, status, duration, runtime commit, and service name. Do not include
  coordinates, search strings, codes, IP addresses, or credentials.
- Document initial service objectives:
  - readiness and web-root monthly availability target: 99.9%;
  - representative encode/search smoke latency target: under 2 seconds;
  - post-deploy full-smoke success required before an incident is closed.
- Keep Cloudflare observability enabled and document the dashboard queries and
  rollback/runbook links used during an incident.

## 6. Production-Smoke Design

Split smoke execution into two profiles while retaining one shared check
implementation:

- **quick:** readiness, web root/robots/sitemap, metrics, representative Earth
  encode/search/decode, one non-Latin language, and Moon/Mars encode;
- **full:** every current language and all operational/error-path checks.

Rules:

- post-Web deploy and manual runs execute the full profile;
- the 30-minute schedule executes quick checks;
- a daily schedule executes full checks;
- full remains the default when the profile is omitted;
- the workflow sparse-checks out only `scripts/production-smoke*.mjs` and uses
  shallow history;
- workflow concurrency cancels an older scheduled smoke when a newer scheduled
  smoke starts, but never cancels a post-deploy full check; and
- notification failure does not hide the original smoke failure.

The workflow-contract tests assert triggers, profiles, sparse checkout,
concurrency, notification behavior, and the complete 180-language full
coverage.

## 7. CI, Deployment, and Coverage

### 7.1 Reproducible workflows

- Use `pnpm install --frozen-lockfile` everywhere.
- Add Wrangler as an exact root development dependency and invoke it through
  pnpm instead of installing a global moving version.
- Pin the Bun runtime to one verified version rather than `latest`.
- Add production concurrency groups to Web and Grok Spiral deployments.
  Superseded queued or in-progress deploys are cancelled so an older commit
  cannot finish after a newer commit.
- Preserve the API deployment's serialized, non-cancelling database import and
  Worker deployment behavior.
- Add `environment: production` to deployment jobs so secrets and deployment
  history are scoped consistently. No manual approval is required by default.

### 7.2 Coverage gates

Coverage applies to maintained executable code, not generated language/data
tables, declarations, Next build output, or third-party assets.

- Add coverage commands for `packages/ground-codes`, `apps/api-ground-codes`,
  and `apps/web` critical libraries/hooks.
- Enforce at least 80% line coverage and 80% function coverage for each scoped
  target. Branch coverage starts at the measured baseline and may only rise.
- Add focused tests where the initial baseline is below the required line or
  function threshold; do not lower the target to make CI pass.
- Include metrics initialization, R2 manifest verification, smoke profile
  selection, dependency audit policy, and deployment workflow contracts in the
  tested surface.

## 8. R2 Region-Data Architecture

### 8.1 Object model

Create the write-private bucket `ground-codes-region-data`, expose only its
immutable dataset objects through a public read endpoint, and use this release
prefix:

```text
releases/<dataset-version>/manifest.json
releases/<dataset-version>/objects/<sha256>.json.gz
```

The version is a content-derived identifier. Each manifest entry contains:

- repository-relative logical path;
- uncompressed byte size;
- compressed byte size;
- SHA-256 of uncompressed content;
- R2 object key; and
- dataset group (`region-dist` or `region-db`).

Identical content is stored once by hash. A small committed manifest pointer
declares the active dataset version. Tiny deterministic test fixtures stay in
Git.

### 8.2 Access and credentials

- Publication uses dedicated least-privilege R2 S3 credentials stored as
  `R2_REGION_DATA_ACCESS_KEY_ID` and `R2_REGION_DATA_SECRET_ACCESS_KEY`, plus
  `CLOUDFLARE_ACCOUNT_ID`.
- CI and public pull requests must not receive write credentials.
- Dataset objects are publicly readable because the same data is already
  public in Git. A repository variable `REGION_DATA_BASE_URL` supplies the
  read-only R2 custom-domain or R2.dev base URL.
- The publisher writes immutable hash keys first and the release manifest last.
  It never overwrites a published release.

### 8.3 Synchronizer

Add a maintained Node synchronizer that:

- downloads only missing or hash-mismatched logical files;
- supports `region-dist`, `region-db`, and explicit-path scopes;
- limits concurrent requests and retries transient failures with backoff;
- decompresses into a temporary file, verifies uncompressed size and SHA-256,
  then atomically renames into place;
- removes neither unrelated files nor user changes by default;
- has a `--prune` mode used only by CI for exact materialization; and
- fails closed on manifest, network, decompression, or hash errors.

No consumer is allowed to silently fall back to incomplete data.

### 8.4 Two-phase cutover

**Phase A: publish and shadow-verify**

1. Generate the manifest for the current Git-tracked data.
2. Upload immutable compressed objects and manifest to R2.
3. Materialize a clean temporary directory from R2 and compare every path,
   size, and hash to Git.
4. Modify CI/deploy workflows to materialize their required scopes from R2.
5. Keep Git data present for one successful PR CI, merged-main CI, API deploy,
   Web deploy, and post-deploy full smoke.

**Phase B: remove from the current tree**

1. Delete `packages/geoint/region-dist` and `packages/geoint/region-db` from the
   current Git tree, retaining fixtures and manifests.
2. Update generators, audits, local setup, CI, and deploy workflows to call the
   synchronizer explicitly.
3. Verify a fresh sparse clone can materialize data, run full tests, build, and
   deploy.
4. Merge only after the R2-only path passes every authoritative check.

Git history is not rewritten. Existing commits remain a recovery source.

### 8.5 Future data publication

Data changes run through a manual or protected workflow that:

1. materializes the active R2 release;
2. runs the existing generator and quality audits;
3. publishes a new immutable release;
4. opens or updates a pull request containing only the manifest pointer,
   documentation, and any source/generator changes; and
5. leaves the previous release available for rollback.

## 9. Failure Handling and Rollback

- Dependency upgrades are reverted as a group if focused tests or production
  smoke regress.
- Metrics initialization never throws; an uninitialized state is initialized
  at request time and tested directly.
- Quick-smoke failure opens or updates one incident issue and sends the Moshi
  notification when configured.
- Deployment workflows expose the commit SHA and keep Cloudflare's immutable
  deployment history. Rollback redeploys the last known-good SHA.
- R2 publication is append-only. The active manifest pointer changes only in
  Git, so rollback is a normal pull request restoring the prior version.
- R2 synchronization failure stops CI/deployment before tests or mutation of
  production infrastructure.
- The Git-data deletion is never merged until R2-only verification passes from
  a fresh checkout.

## 10. Verification and Completion Criteria

The program is complete only when all of the following evidence exists for the
same merged `main` commit:

1. `pnpm audit --prod --audit-level high` exits successfully with zero high or
   critical advisories.
2. Format, source-size, lint, type, operational-script, data-quality, unit,
   coverage, build, and browser-smoke CI gates pass from a full authoritative
   environment.
3. Production metrics show a realistic ISO `startedAt`, consistent uptime,
   valid counters, and the merged runtime commit.
4. Quick and full smoke profiles both pass, and a scheduled run demonstrates
   the sparse checkout path.
5. API, Web, and Grok Spiral production deployments succeed.
6. `main` ruleset, Dependabot security updates, secret scanning, push
   protection, merged-branch deletion, and required Actions secrets are
   verified through GitHub's APIs without exposing secret values.
7. R2 manifest publication and a clean R2 materialization produce every
   expected file with matching SHA-256.
8. `region-dist` and `region-db` are absent from the current Git tree except for
   explicitly declared fixtures/manifests, and a fresh checkout passes the
   full R2-only CI/deploy path.
9. The post-deploy full production smoke passes and any issue opened by a
   regression is resolved with links to the successful runs.

## 11. Out of Scope

- Rewriting existing Git history or force-pushing `main`.
- Migrating away from Cloudflare Pages/Workers or Supabase/PostGIS.
- Unrelated Next, React, TypeScript, ESLint, or UI feature rewrites.
- Requiring a second human reviewer in a single-maintainer repository.
- Making private data public; only the already-public region datasets are
  eligible for the public read endpoint.
