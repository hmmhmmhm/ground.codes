# Metrics, Smoke, and Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct Worker-isolate start time/uptime, emit privacy-safe structured request completion logs, split production smoke into cost-efficient quick/full profiles, and document measurable operating objectives.

**Architecture:** Metrics state is created per Elysia app and initialized only inside request handling through an injected clock. Smoke checks remain in one implementation registry and profiles select subsets by stable check IDs. The workflow captures smoke outcome, attempts notifications independently, and re-emits the original failure after all notification steps.

**Tech Stack:** TypeScript, Elysia hooks, Bun tests, Node.js test runner/fetch, GitHub Actions, Cloudflare Workers observability.

**Execution Order:** Run after `2026-07-13-security-governance.md` and before the coverage plan so the corrected metrics and smoke-profile modules enter the first coverage baseline.

---

### Task 1: Reproduce the epoch-start bug with a deterministic metrics clock

**Files:**

- Modify: `apps/api-ground-codes/src/endpoints/metrics.ts`
- Create: `apps/api-ground-codes/src/metrics.test.ts`
- Modify: `apps/api-ground-codes/src/app.ts`
- Modify: `apps/api-ground-codes/src/app.test.ts`

- [x] Add a `metrics.test.ts` contract that constructs an app with a clock whose module-creation wall time is `0`, advances it to `2026-07-13T00:00:00.000Z` before the first request, and expects `startedAt` to equal the request-time value rather than 1970.
- [x] Add assertions for a second request 5.4 seconds later: `startedAt` is unchanged, uptime rounds consistently, counters stay finite, and `/metrics` itself is not counted.
- [x] Run `pnpm --filter api-ground-codes test`; expect RED because metrics currently initialize eagerly and the app cannot inject a clock.
- [x] Introduce these testable interfaces without retaining global eager wall-clock state:

  ```ts
  export interface MetricsClock {
    nowMs(): number;
    monotonicMs(): number;
  }

  export interface MetricsOptions {
    clock?: MetricsClock;
    writeLog?: (record: RequestCompletionLog) => void;
  }

  export const createMetricsEndpoint = (options: MetricsOptions = {}) => {
    let startedAtMs: number | undefined;
    // onRequest: startedAtMs ??= clock.nowMs()
  };
  ```

- [x] Extend `AppOptions` with `metrics?: MetricsOptions`, replace the singleton `.use(metricsEndpoint)` with `.use(createMetricsEndpoint(options.metrics))`, and ensure each test app owns isolated counters.
- [x] Serialize `startedAt` from the stored millisecond value and calculate `uptimeSeconds` from that same value with `Math.max(0, ...)`. Include `runtimeCommit` in the metrics response.
- [x] Run API tests; expect PASS and no epoch timestamps.
- [x] Commit as `fix(api): initialize metrics clock on first request`.

### Task 2: Emit a privacy-safe structured request completion record

**Files:**

- Modify: `apps/api-ground-codes/src/endpoints/metrics.ts`
- Modify: `apps/api-ground-codes/src/metrics.test.ts`
- Modify: `apps/api-ground-codes/src/worker.ts`

- [x] Add failing tests that send encode/search requests containing sentinel coordinates, query text, codes, IP headers, and authorization values. Parse captured log output and assert none of the sentinels occur.
- [x] Assert exactly one completion record per request, including error responses, with this schema:

  ```ts
  interface RequestCompletionLog {
    event: "api.request.completed";
    service: "api-ground-codes";
    route: string;
    method: string;
    status: string;
    durationMs: number;
    runtimeCommit: string;
  }
  ```

- [x] Run the metrics tests; expect RED because no completion log is emitted.
- [x] Reuse `recordRequest` to produce the record from the matched route template, `request.method`, normalized final response status, duration, and runtime metadata. Do not serialize URL queries, bodies, headers, region names, coordinates, search terms, or generated codes.
- [x] Default `writeLog` to `record => console.log(record)` so Cloudflare indexes the structured object; keep it injectable so tests capture records without patching the console.
- [x] Guard against duplicate records when the Elysia error hook runs by deleting the request's start marker after completion.
- [x] Run API tests and inspect a representative `/readyz` completion record; expect exactly the seven application fields and no request content.
- [x] Commit as `feat(api): emit structured completion logs`.

### Task 3: Strengthen the production metrics validator

**Files:**

- Modify: `scripts/production-smoke-helpers.mjs`
- Modify: `scripts/production-smoke.test.mjs`

- [x] Replace the empty valid fixture with one containing `service`, `scope`, a valid post-2020 `startedAt`, `uptimeSeconds`, `runtimeCommit`, and counters. Add failing fixtures for invalid ISO, pre-2020 date, future date, inconsistent uptime, missing service, missing runtime commit, and non-finite nested values.
- [x] Run `node --test scripts/production-smoke.test.mjs`; expect RED for the missing timestamp/commit validation.
- [x] Change the validator signature to accept a deterministic comparison time:

  ```js
  export const validateMetricsSnapshot = (
    metrics,
    { nowMs = Date.now(), uptimeToleranceSeconds = 3 } = {},
  ) => errors;
  ```

- [x] Require `startedAt >= 2020-01-01T00:00:00.000Z`, `startedAt <= now + 3s`, `Math.abs(expectedUptime - uptimeSeconds) <= 3`, service `api-ground-codes`, scope `worker-isolate`, and a 40-character runtime commit. Keep empty route maps valid.
- [x] Run the smoke tests; expect PASS.
- [x] Commit as `test(smoke): validate metrics clock and runtime metadata`.

### Task 4: Define one smoke registry with quick and full profiles

**Files:**

- Create: `scripts/production-smoke-profiles.mjs`
- Create: `scripts/production-smoke-quick.mjs`
- Modify: `scripts/production-smoke.mjs`
- Modify: `scripts/production-smoke-core.mjs`
- Modify: `scripts/production-smoke-expanded.mjs`
- Modify: `scripts/production-smoke-additional.mjs`
- Modify: `scripts/production-smoke-additional-latin.mjs`
- Modify: `scripts/production-smoke-operations.mjs`
- Modify: `scripts/production-smoke.test.mjs`
- Modify: `scripts/language-support-completeness.test.mjs`
- Modify: `package.json`

- [x] Add tests for `resolveSmokeProfile(undefined) === "full"`, explicit `quick`/`full`, rejection of unknown profiles, stable check IDs, and the exact runner selection. Assert the full registry covers every API language exactly once while quick contains at least one non-Latin language.
- [x] Run focused tests; expect RED because profiles do not exist and all modules currently run unconditionally.
- [x] Extract the shared fast checks into `runQuickSmokeChecks`: API readiness, Web root, robots, sitemap, metrics, representative English Earth encode/search/decode, Korean encode, Moon encode, and Mars encode. Each check keeps the same HTTP implementation when selected from full.
- [x] Leave all remaining 180-language cases in the existing split modules and move only operational/error checks not already in quick to `runFullOperationsSmokeChecks`.
- [x] Implement the registry:

  ```js
  export const smokeProfiles = {
    quick: [runQuickSmokeChecks],
    full: [
      runQuickSmokeChecks,
      runCoreLanguageSmokeChecks,
      runExpandedSmokeChecks,
      runAdditionalSmokeChecks,
      runAdditionalLatinSmokeChecks,
      runFullOperationsSmokeChecks,
    ],
  };
  ```

- [x] Read `GROUND_CODES_SMOKE_PROFILE`, default to full, print the chosen profile in console and step summary, and preserve forced-failure testing.
- [x] Add root commands:

  ```json
  "production:smoke": "node scripts/production-smoke.mjs",
  "production:smoke:quick": "GROUND_CODES_SMOKE_PROFILE=quick node scripts/production-smoke.mjs",
  "production:smoke:full": "GROUND_CODES_SMOKE_PROFILE=full node scripts/production-smoke.mjs"
  ```

- [x] Run `node --test scripts/production-smoke.test.mjs scripts/language-support-completeness.test.mjs`; expect PASS and exact 180-language full coverage.
- [x] Run quick and full against production; expect both PASS and quick to execute materially fewer checks.
- [x] Commit as `feat(smoke): add quick and full profiles`.

### Task 5: Make smoke failure notification independent from test outcome

**Files:**

- Create: `scripts/production-smoke-notify.mjs`
- Create: `scripts/production-smoke-notify.test.mjs`
- Modify: `.github/workflows/production-smoke.yml`
- Modify: `scripts/qa-workflows.test.mjs`

- [x] Write notifier tests with an injected `fetch` for success, missing token, HTTP failure, and exception. Assert the payload contains only title, run URL/message, and token from the environment—not smoke request data.
- [x] Add workflow-contract tests that require the smoke step to use `continue-on-error: true`, notification steps to inspect `steps.smoke.outcome`, and a final step to exit 1 after notifications when smoke failed.
- [x] Run both test files; expect RED.
- [x] Implement the notifier using `process.env.MOSHI_WEBHOOK_TOKEN` and JSON-encoded `fetch` body, returning a non-zero exit on delivery failure without printing the token.
- [x] Restructure the workflow steps in this order: run smoke and capture outcome; attempt Moshi with `continue-on-error: true`; create/update the fallback issue when the token is missing or delivery fails; finally fail the job if the captured smoke outcome was failure.
- [x] Run notifier/workflow tests; expect PASS.
- [x] Commit as `fix(smoke): preserve failures across notification attempts`.

### Task 6: Reduce scheduled smoke checkout and runner work

**Files:**

- Modify: `.github/workflows/production-smoke.yml`
- Modify: `scripts/qa-workflows.test.mjs`

- [x] Add failing workflow assertions for shallow history, non-cone sparse checkout of `scripts/production-smoke*.mjs`, two schedules, profile mapping, and event-aware concurrency.
- [x] Configure schedules and manual input:

  ```yaml
  workflow_dispatch:
    inputs:
      profile:
        type: choice
        options: [full, quick]
        default: full
  schedule:
    - cron: "*/30 * * * *" # quick
    - cron: "17 3 * * *" # daily full
  ```

- [x] Set `GROUND_CODES_SMOKE_PROFILE` so the daily cron, Web `workflow_run`, and default manual invocation use full; the 30-minute cron uses quick; an explicit manual selection wins.
- [x] Configure checkout with `fetch-depth: 1`, `sparse-checkout-cone-mode: false`, and only `scripts/production-smoke*.mjs`.
- [x] Use a shared `scheduled` concurrency group with `cancel-in-progress: true` only for schedule events. Give post-deploy and manual runs unique groups so they are never cancelled by a newer scheduled run.
- [x] Run `node --test scripts/qa-workflows.test.mjs`; expect PASS.
- [x] Trigger one manual quick and one manual full run, and inspect checkout timing/artifact summary.
- [x] Commit as `ci(smoke): use profiles and sparse checkout`.

### Task 7: Document SLOs, queries, and rollback operations

**Files:**

- Create: `docs/operations/service-objectives.md`
- Create: `docs/operations/incident-runbook.md`
- Modify: `README.md`
- Modify: `apps/api-ground-codes/src/app.test.ts`

- [x] Add a documentation contract test that asserts the service-objectives document states 99.9% monthly readiness and Web-root availability, representative encode/search under 2 seconds, and full post-deploy smoke before incident closure.
- [x] Document Cloudflare observability filters for `event=api.request.completed`, status families, route duration, runtime commit, and deployment rollback to the last known-good SHA. Link the smoke workflow, Worker/Pages deployment histories, metrics endpoint, and incident issue workflow.
- [x] State explicitly that logs must not include coordinates, search strings, ground codes, IP addresses, headers, or credentials.
- [x] Link the operational documents from the root README.
- [x] Run API/document tests and Prettier; expect PASS.
- [x] Commit as `docs(operations): define service objectives and runbook`.

### Task 8: Complete the metrics and smoke stage gate

**Files:**

- Modify: this plan

- [x] Run `pnpm --filter api-ground-codes test`, `pnpm scripts:test`, `pnpm check-types`, and `pnpm build`; expect PASS.
- [x] Run `GROUND_CODES_SMOKE_PROFILE=quick pnpm production:smoke` and `GROUND_CODES_SMOKE_PROFILE=full pnpm production:smoke`; expect both PASS.
- [x] Fetch production `/metrics` after deployment and verify a post-2020 ISO `startedAt`, consistent uptime within 3 seconds, valid counters, and the deployed 40-character commit.
- [x] Inspect Cloudflare logs for a representative request and verify the completion JSON schema contains no request payload or identifiers.
- [x] Mark all completed checkboxes and commit as `docs: complete metrics and smoke plan`.

## Completion evidence (2026-07-14)

- Tasks 1–7 landed in `55aa474`, `d0f8ddf`, `da7cb3b`, `7ecce48`,
  `0b7eb30`, `9796817`, and `6ff509b`; follow-up correctness and operations
  hardening landed through `dcfae00`.
- [CI run 29301471587](https://github.com/hmmhmmhm/ground.codes/actions/runs/29301471587)
  passed the full-checkout scripts, types, API/Web/package tests, build, and
  browser gates at `43e7f91`. Local focused metrics/Worker, smoke, notifier,
  workflow, and document-contract tests were rerun at plan closure. The sparse
  local checkout omits the multi-gigabyte region assets, so the full
  data-dependent language/API gates are evidenced by Actions.
- Manual [quick run 29298901653](https://github.com/hmmhmmhm/ground.codes/actions/runs/29298901653)
  and [full run 29298902853](https://github.com/hmmhmmhm/ground.codes/actions/runs/29298902853)
  both passed; their smoke jobs took about 10 seconds and 57 seconds,
  respectively.
- [API deploy run 29303730319](https://github.com/hmmhmmhm/ground.codes/actions/runs/29303730319)
  passed API types/tests, deployed `4fc2121342f4fe44f86303d6b46acd295369dfa7`,
  and passed the full production smoke. Production `/metrics` then passed the
  deterministic validator with that commit, a post-2020 ISO start time,
  consistent uptime, and finite counters.
- [Worker log proof run 29303880591](https://github.com/hmmhmmhm/ground.codes/actions/runs/29303880591)
  verified the exact seven-field completion object (`event`, `service`,
  `route`, `method`, `status`, `durationMs`, `runtimeCommit`) for `/readyz`.
  Exact-key matching excludes request payloads and identifiers; the temporary
  diagnostic branch was deleted after the successful proof.
