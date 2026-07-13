# CI, Deployment, and Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every automated install and production deploy reproducible, prevent stale Web/Grok deploys from winning races, and enforce measured coverage floors for critical maintained code.

**Architecture:** Tool versions live in the workspace lockfile and package manifests; workflows invoke local binaries only. Coverage producers emit LCOV into one root directory, and a pure policy checker aggregates only declared maintained source files per target. Line/function floors are fixed at 80%; branch floors are captured from the first green baseline and may only rise.

**Tech Stack:** pnpm/Turborepo, Bun 1.3.1, Node.js, c8 11, LCOV, GitHub Actions, Wrangler 4.110.0, Cloudflare Pages/Workers.

**Execution Order:** Run after the security and metrics/smoke plans and finish it before R2 Phase A. The R2 plan explicitly extends the established operations coverage target with its new modules.

---

### Task 1: Pin workflow runtimes and the local Cloudflare CLI

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy-api.yml`
- Modify: `.github/workflows/deploy-web.yml`
- Modify: `.github/workflows/deploy-grok-spiral.yml`
- Modify: `.github/workflows/visual-qa.yml`
- Modify: `scripts/qa-workflows.test.mjs`

- [ ] Extend workflow tests to require `bun-version: "1.3.1"`, frozen installs in every workflow that installs packages, no `pnpm install -g`, and deployment commands that invoke `pnpm exec wrangler` or a package script backed by it.
- [ ] Run `node --test scripts/qa-workflows.test.mjs`; expect RED for Bun `latest`, unfrozen Web/Grok installs, and global Wrangler installation.
- [ ] Add exact root development dependencies:

  ```sh
  pnpm add -Dw --save-exact wrangler@4.110.0 c8@11.0.0
  ```

- [ ] Change every Bun setup to `bun-version: "1.3.1"` and every workflow install to `pnpm install --frozen-lockfile`.
- [ ] Remove global Wrangler steps. Change app deploy scripts to run `pnpm exec wrangler pages deploy`, and API deployment to run `pnpm exec wrangler deploy --config apps/api-ground-codes/wrangler.toml ...` from the repository root.
- [ ] Run `pnpm install --frozen-lockfile`, `pnpm exec wrangler --version`, and the workflow tests; expect Wrangler `4.110.0` and PASS.
- [ ] Commit as `chore(ci): pin bun and wrangler toolchain`.

### Task 2: Serialize production deployment outcomes correctly

**Files:**

- Modify: `.github/workflows/deploy-api.yml`
- Modify: `.github/workflows/deploy-web.yml`
- Modify: `.github/workflows/deploy-grok-spiral.yml`
- Modify: `scripts/qa-workflows.test.mjs`

- [ ] Add contract assertions for named production environments and exact concurrency semantics: Web/Grok cancel superseded work, API remains serialized without cancellation.
- [ ] Run workflow tests; expect RED because Web/Grok lack concurrency and jobs lack environments.
- [ ] Add these workflow-level blocks:

  ```yaml
  # deploy-web.yml
  concurrency:
    group: deploy-web-production
    cancel-in-progress: true

  # deploy-grok-spiral.yml
  concurrency:
    group: deploy-grok-spiral-production
    cancel-in-progress: true
  ```

- [ ] Preserve API's `deploy-api-production` group with `cancel-in-progress: false` so a database import/deploy is never interrupted.
- [ ] Add `environment: production` to all three deployment jobs. Do not add a reviewer/approval gate to the environment.
- [ ] Run workflow tests; expect PASS.
- [ ] Commit as `ci(deploy): enforce production concurrency`.

### Task 3: Build an LCOV policy checker test-first

**Files:**

- Create: `scripts/coverage-policy.mjs`
- Create: `scripts/coverage-policy.test.mjs`
- Create: `scripts/check-coverage.mjs`
- Modify: `package.json`

- [ ] Write temporary LCOV fixture tests for line, function, and branch aggregation; missing declared files; duplicate records; excluded generated files; exactly-at-threshold PASS; and below-threshold RED.
- [ ] Use a temporary fixture policy with four targets so tests prove failures are reported per target rather than hidden by a repository-wide average.
- [ ] Run `node --test scripts/coverage-policy.test.mjs`; expect RED because the parser/checker does not exist.
- [ ] Implement `parseLcov`, `collectTargetCoverage`, and `evaluateCoveragePolicy`. Normalize source paths relative to repository root and require every explicitly included file/glob to be represented.
- [ ] Define and test the policy schema without creating the real repository policy yet:

  ```json
  {
    "schemaVersion": 1,
    "targets": {
      "ground-codes": {
        "lcov": "coverage/ground-codes/lcov.info",
        "include": ["packages/ground-codes/src/**/*.ts"],
        "exclude": ["**/*.d.ts"],
        "minimum": { "line": 0.8, "function": 0.8, "branch": 0.731 }
      }
    }
  }
  ```

  The `0.731` branch value is fixture data used only by the unit test. Task 7 creates the real policy from measured reports.

- [ ] Make `check-coverage.mjs` print one compact line per target and exit non-zero for a missing report/file or failed metric.
- [ ] Add `coverage:check` as `node scripts/check-coverage.mjs`.
- [ ] Run the policy tests; expect PASS.
- [ ] Commit as `test(coverage): define lcov policy enforcement`.

### Task 4: Produce coverage for the Ground Codes core

**Files:**

- Modify: `packages/ground-codes/package.json`
- Modify: `package.json`
- Modify: `packages/ground-codes/test/region-dataset-resolver.test.ts`
- Modify: `packages/ground-codes/test/region-store.test.ts`
- Modify: `packages/ground-codes/test/region-fallback.test.ts`
- Modify: `packages/ground-codes/test/spiral-fixture.test.ts`

- [ ] Add a `test:coverage` command that uses the exact root c8 binary, source maps, `--all`, `--include src/**/*.ts`, `--exclude src/**/*.d.ts`, and LCOV output at `coverage/ground-codes`.
- [ ] Add the root `coverage:ground-codes` command to invoke that package script without Turbo caching.
- [ ] Run `pnpm coverage:ground-codes`; expect `coverage/ground-codes/lcov.info` and a readable text summary.
- [ ] Add focused tests for any untested resolver/cache/error branches until maintained core line and function coverage each reach at least 80%. Do not remove files from the target to make the result pass.
- [ ] Run the core unit and standalone package tests after coverage; expect PASS.
- [ ] Commit as `test(ground-codes): add maintained-source coverage`.

### Task 5: Produce coverage for API and critical Web code

**Files:**

- Modify: `apps/api-ground-codes/package.json`
- Modify: `apps/web/package.json`
- Modify: `package.json`
- Modify: `apps/api-ground-codes/src/app.test.ts`
- Modify: `apps/api-ground-codes/src/app-part-2.test.ts`
- Modify: `apps/api-ground-codes/src/app-part-3.test.ts`
- Modify: `apps/api-ground-codes/src/app-part-4.test.ts`
- Modify: `apps/api-ground-codes/src/metrics.test.ts`
- Modify: `apps/web/lib/code/ground-codes.test.ts`
- Modify: `apps/web/lib/code/share-url.test.ts`
- Modify: `apps/web/lib/i18n/ground-code-language.test.ts`
- Modify: `apps/web/lib/map/celestial-bodies.test.ts`
- Modify: `apps/web/lib/map/google-maps-availability.test.ts`
- Modify: `apps/web/hooks/use-disable-zoom.test.ts`

- [ ] Add Bun LCOV commands:

  ```json
  "test:coverage": "bun test --coverage --coverage-reporter=lcov --coverage-dir=../../coverage/api src/*.test.ts"
  ```

  for the API, and the corresponding Web command targeting `./lib ./app ./components ./hooks` with output `../../coverage/web`.

- [ ] Declare all maintained API `src/**/*.ts` files except `*.test.ts`, declarations, and generated OpenAPI/build output as the API target.
- [ ] Declare these critical Web sources as the minimum Web target, expanding rather than shrinking the list when another critical pure library/hook is identified:

  ```text
  apps/web/lib/code/ground-codes.ts
  apps/web/lib/code/share-url.ts
  apps/web/lib/i18n/ground-code-language.ts
  apps/web/lib/map/celestial-bodies.ts
  apps/web/lib/map/google-maps-availability.ts
  apps/web/hooks/use-disable-zoom.ts
  ```

- [ ] Run both coverage producers; expect LCOV reports. Add focused tests for metrics initialization/logging, validation errors, Web URL/code behavior, locale resolution, body selection, map availability, and zoom cleanup until line and function coverage are at least 80% for each target.
- [ ] Ensure the policy excludes test files, declarations, `.next`, `.vercel`, generated language/data tables, and third-party assets—never ordinary maintained runtime modules.
- [ ] Run API/Web unit and type tests; expect PASS.
- [ ] Commit as `test(apps): add api and web coverage`.

### Task 6: Cover critical operational policy code

**Files:**

- Modify: `package.json`
- Modify: `scripts/production-audit-policy.test.mjs`
- Modify: `scripts/production-smoke.test.mjs`
- Modify: `scripts/qa-workflows.test.mjs`
- Modify: `scripts/github-governance.test.mjs`

- [ ] Add `coverage:operations` using c8/Node test with LCOV output at `coverage/operations`. Include exactly the security-audit policy, smoke helpers/profile selection, workflow/governance policy, and coverage policy modules; exclude CLI entry points whose only behavior is process wiring.
- [ ] Run the operations coverage producer; expect every declared module in LCOV and all existing contract tests PASS.
- [ ] Add focused error/edge cases until line and function coverage for this target are each at least 80%. This makes metrics, smoke profiles, audit policy, and workflow contracts part of the authoritative covered surface; the R2 plan later adds manifest/synchronizer/publisher/verification modules to the same target.
- [ ] Commit as `test(operations): cover automation policy modules`.

### Task 7: Record and lock the branch baselines

**Files:**

- Modify: `scripts/check-coverage.mjs`
- Create: `scripts/coverage-policy.json`
- Create: `docs/quality/coverage.md`

- [ ] Add a read-only `--report-baseline` mode that prints exact line/function/branch ratios from the four LCOV reports but never writes policy.
- [ ] Run all four coverage commands followed by `node scripts/check-coverage.mjs --report-baseline`; expect finite branch ratios for every target.
- [ ] Set each target's committed branch minimum to its measured ratio rounded down by less than 0.001, while keeping line/function exactly `0.8`. If a producer emits no branch records, add/replace instrumentation rather than committing a zero branch floor.
- [ ] Document the measured values, date, Bun/c8 versions, included source boundary, and the rule that thresholds may only increase in `docs/quality/coverage.md`.
- [ ] Run `pnpm coverage:check`; expect all four targets PASS.
- [ ] Commit as `test(coverage): lock measured branch baselines`.

### Task 8: Add the authoritative coverage command and CI gate

**Files:**

- Create: `scripts/run-coverage.mjs`
- Create: `scripts/run-coverage.test.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `turbo.json`
- Modify: `scripts/qa-workflows.test.mjs`

- [ ] Test that the orchestrator executes the four producers in a fixed order, stops on producer failure, removes stale target reports first, and runs the policy checker last.
- [ ] Implement root `coverage` as `node scripts/run-coverage.mjs`; do not reuse stale LCOV or allow Turbo cache to stand in for execution.
- [ ] Add `coverage/**` to appropriate ignored build outputs while keeping reports out of Git.
- [ ] Add a named `Enforce coverage policy` CI step after unit tests and before build. Assert it in workflow tests.
- [ ] Run `pnpm coverage`, `pnpm scripts:test`, and `node --test scripts/qa-workflows.test.mjs`; expect PASS.
- [ ] Commit as `ci: enforce coverage policy`.

### Task 9: Verify reproducible deploy commands without publishing

**Files:**

- Modify: `docs/operations/incident-runbook.md`

- [ ] Run `pnpm install --frozen-lockfile` twice; expect no manifest or lockfile changes.
- [ ] Run `pnpm --filter web pages:build`, `pnpm --filter grok-spiral pages:build`, and `pnpm --filter api-ground-codes build`; expect PASS using only lockfile-resolved tools.
- [ ] Run `pnpm exec wrangler deploy --config apps/api-ground-codes/wrangler.toml --dry-run --outdir /tmp/ground-codes-worker-dry-run`; expect a Worker bundle without production mutation.
- [ ] Document the local exact-version verification and deployment rollback commands.
- [ ] Commit as `docs(deploy): record reproducible release commands`.

### Task 10: Complete the CI/deploy/coverage stage gate

**Files:**

- Modify: this plan

- [ ] Run `pnpm format:check`, `pnpm code:size-check`, `pnpm security:audit`, `pnpm scripts:test`, `pnpm lint`, `pnpm check-types`, `pnpm coverage`, and `pnpm build`; expect PASS.
- [ ] Confirm `git grep -n 'pnpm install -g\|bun-version: latest\|pnpm install$' .github/workflows` returns no matches.
- [ ] Confirm workflow tests prove Web/Grok cancellation, API non-cancellation, production environments, frozen installs, pinned actions, and local Wrangler use.
- [ ] Mark all checkboxes and commit as `docs: complete ci deployment coverage plan`.
