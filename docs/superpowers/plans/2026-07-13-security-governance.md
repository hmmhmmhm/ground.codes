# Security and Repository Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every high/critical production dependency advisory, eliminate moving runtime pins, make dependency and workflow security enforceable in CI, and configure GitHub repository security controls without exposing credentials.

**Architecture:** Security policy is expressed as small Node scripts with fixture-driven tests and workflow-contract assertions. Runtime upgrades are committed in compatible groups so each can be reverted independently. Repository settings are applied by an idempotent `gh api` wrapper only after the stable `verify` check exists on the pull request.

**Tech Stack:** pnpm 9, Node.js ESM, Bun/Elysia, Next.js, GitHub Actions, Dependabot, GitHub REST API, `gh` CLI.

**Execution Order:** Run this plan first. The metrics, CI/coverage, and R2 plans rely on its pinned actions, audit command, and stable `verify` check.

---

### Task 1: Turn the production audit requirement into an executable policy

**Files:**

- Create: `scripts/production-audit-policy.mjs`
- Create: `scripts/production-audit-policy.test.mjs`
- Create: `scripts/check-production-audit.mjs`
- Modify: `package.json`

- [ ] Write fixture-driven tests that pass when `metadata.vulnerabilities.high` and `critical` are zero, fail when either is non-zero, and preserve moderate/low counts for the report. Cover both a single pnpm JSON document and newline-delimited diagnostic output before the final JSON document.
- [ ] Run `node --test scripts/production-audit-policy.test.mjs` and verify RED because the policy module does not exist.
- [ ] Implement a pure parser and evaluator with this public shape:

  ```js
  export const evaluateProductionAudit = (rawAuditJson) => ({
    ok: high === 0 && critical === 0,
    counts: { critical, high, moderate, low },
  });
  ```

- [ ] Implement `check-production-audit.mjs` so it runs `pnpm audit --prod --json`, prints only severity counts and advisory package names, and exits non-zero only for high/critical findings or an unreadable audit result. Never print dependency environment values.
- [ ] Add exact root scripts:

  ```json
  "security:audit": "node scripts/check-production-audit.mjs",
  "security:audit:raw": "pnpm audit --prod --audit-level high"
  ```

- [ ] Run `node --test scripts/production-audit-policy.test.mjs`; expect all policy tests PASS.
- [ ] Run `pnpm security:audit`; expect RED against the current lockfile with `critical=0 high=4`.
- [ ] Commit the test-first policy as `test(security): enforce production audit severity`.

### Task 2: Upgrade and pin the Elysia runtime group

**Files:**

- Modify: `apps/api-ground-codes/package.json`
- Modify: `scripts/api-runtime-pins.test.mjs`
- Modify: `scripts/check-api-runtime-pins.mjs`
- Modify: `scripts/update-api-runtime-pins.mjs`
- Modify: `pnpm-lock.yaml`

- [ ] Change the existing runtime-pin tests to require exact semver values and to reject `latest`, `*`, Git branch references, and unbounded ranges for `elysia` and `bun-types`. Add plugin compatibility assertions.
- [ ] Run `node --test scripts/api-runtime-pins.test.mjs`; expect RED because the current package still uses `latest`.
- [ ] Install this reviewed compatible group with exact specifications:

  ```sh
  pnpm --filter api-ground-codes add --save-exact \
    elysia@1.4.29 @elysiajs/cors@1.4.2 \
    @elysiajs/static@1.4.10 @elysiajs/swagger@1.3.1
  pnpm --filter api-ground-codes add --save-dev --save-exact bun-types@1.3.1
  ```

- [ ] Update the runtime-pin checker/updater so generated deployment package manifests retain those exact versions rather than restoring `latest`.
- [ ] Run `pnpm runtime:check-pins`, `pnpm --filter api-ground-codes check-types`, and `pnpm --filter api-ground-codes test`; expect PASS with the existing API contract unchanged.
- [ ] Run `pnpm --filter api-ground-codes build`; expect the workspace runtime build to complete.
- [ ] Commit as `chore(api): upgrade and pin elysia runtime`.

### Task 3: Upgrade vulnerable Web dependencies and lock transitive fixes

**Files:**

- Modify: `apps/web/package.json`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `docs/security/dependency-audit.md`

- [ ] Add a contract test to `scripts/production-audit-policy.test.mjs` that rejects a lockfile finding whose severity is high even when it is transitive.
- [ ] Upgrade Web runtime dependencies exactly:

  ```sh
  pnpm --filter web add --save-exact next-intl@4.13.2 cesium@1.143.0
  ```

- [ ] Add root pnpm overrides for the reviewed fixed transitive floors, using exact values:

  ```json
  "pnpm": {
    "overrides": {
      "dompurify@3.4.2": "3.4.12",
      "picomatch@2.3.1": "2.3.2",
      "postcss@8.4.31": "8.4.49",
      "postcss@8.5.3": "8.5.19",
      "protobufjs@8.2.0": "8.7.1"
    }
  }
  ```

- [ ] Run `pnpm install --frozen-lockfile`; expect no lockfile drift after the upgrade command has written the lockfile.
- [ ] Run `pnpm --filter web test`, `pnpm --filter web check-types`, `pnpm --filter web build`, and `pnpm --filter web test:e2e:smoke`; expect PASS.
- [ ] Run `pnpm security:audit`; expect `critical=0 high=0`. If moderate findings remain, document each package, affected path, runtime applicability, mitigating control, and a concrete GitHub issue URL in `docs/security/dependency-audit.md`; do not waive a high/critical finding.
- [ ] Commit as `chore(web): remediate production dependency advisories`.

### Task 4: Add Dependabot and pin every GitHub Action

**Files:**

- Create: `.github/dependabot.yml`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy-api.yml`
- Modify: `.github/workflows/deploy-web.yml`
- Modify: `.github/workflows/deploy-grok-spiral.yml`
- Modify: `.github/workflows/production-smoke.yml`
- Modify: `.github/workflows/visual-qa.yml`
- Modify: `scripts/qa-workflows.test.mjs`

- [ ] Extend workflow-contract tests to reject any `uses:` value that is not a local action and does not end in a 40-character hexadecimal SHA plus a release comment. Assert weekly npm and GitHub Actions Dependabot groups with a pull-request limit.
- [ ] Run `node --test scripts/qa-workflows.test.mjs`; expect RED for the current mutable tags and absent Dependabot config.
- [ ] Create `.github/dependabot.yml` with `/` npm updates and GitHub Actions updates scheduled weekly on Monday in `Asia/Seoul`, grouped separately as `runtime-security`, `development-tooling`, and `github-actions`, with a limit of 10 open PRs.
- [ ] Replace current action tags with these resolved SHAs and adjacent comments:

  ```yaml
  uses: actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10 # v6
  uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6
  uses: actions/cache@caa296126883cff596d87d8935842f9db880ef25 # v5
  uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7
  uses: actions/github-script@ed597411d8f924073f98dfc5c65a23a2325f34cd # v8
  uses: pnpm/action-setup@0ebf47130e4866e96fce0953f49152a61190b271 # v6
  uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2
  ```

- [ ] Run `node --test scripts/qa-workflows.test.mjs`; expect PASS.
- [ ] Commit as `chore(actions): pin automation and add dependabot`.

### Task 5: Make GitHub governance configuration reproducible

**Files:**

- Create: `scripts/github-governance.mjs`
- Create: `scripts/github-governance.test.mjs`
- Create: `scripts/configure-github-governance.mjs`
- Modify: `package.json`
- Modify: `docs/security/dependency-audit.md`

- [ ] Write tests for a pure ruleset builder and repository settings patch. Assert `refs/heads/main`, pull requests with zero required approvals, strict `verify` status, deletion/non-fast-forward protections, administrator-only bypass, security-analysis enablement, and merged-branch deletion.
- [ ] Run `node --test scripts/github-governance.test.mjs`; expect RED because the module is absent.
- [ ] Implement an idempotent `gh api` wrapper that discovers an existing ruleset by name `main-protection`, creates it when absent, and updates the same ruleset when present. Its rules payload must include:

  ```js
  rules: [
    { type: "deletion" },
    { type: "non_fast_forward" },
    {
      type: "pull_request",
      parameters: { required_approving_review_count: 0 },
    },
    {
      type: "required_status_checks",
      parameters: {
        strict_required_status_checks_policy: true,
        required_status_checks: [{ context: "verify" }],
      },
    },
  ];
  ```

  Set `bypass_actors` to `[{ actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "always" }]`, which is the repository administrator role; do not grant bypass to write/maintain roles or GitHub Apps.

- [ ] Have the same command enable `delete_branch_on_merge`, Dependabot security updates, secret scanning, push protection, non-provider patterns, and validity checks where the public-repository API reports support. Treat an unsupported optional feature as a named warning; treat failure to enable core secret scanning/push protection as fatal.
- [ ] Add root scripts:

  ```json
  "github:governance:apply": "node scripts/configure-github-governance.mjs --apply",
  "github:governance:verify": "node scripts/configure-github-governance.mjs --verify"
  ```

- [ ] Run the unit tests; expect PASS without making network calls.
- [ ] Commit as `feat(security): codify repository governance`.

### Task 6: Wire the security gates into CI

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `scripts/qa-workflows.test.mjs`
- Modify: `docs/security/dependency-audit.md`

- [ ] Add contract assertions that the `verify` job runs `pnpm install --frozen-lockfile`, `pnpm security:audit`, and all governance/pinning script tests before build/deploy-relevant tests.
- [ ] Run the workflow tests; expect RED until CI contains the audit gate.
- [ ] Add a named `Audit production dependencies` step that runs `pnpm security:audit` immediately after install and before expensive browser setup.
- [ ] Run `pnpm scripts:test`, `pnpm security:audit`, `pnpm lint`, and `pnpm check-types`; expect PASS and zero high/critical advisories.
- [ ] Commit as `ci: enforce production security policy`.

### Task 7: Apply and verify external GitHub security settings

**Files:**

- Modify: `docs/security/dependency-audit.md`

- [ ] Push the feature branch first and confirm the pull request exposes the stable status check name `verify`; do not activate the required check before it exists.
- [ ] Set `MOSHI_WEBHOOK_TOKEN` with `gh secret set MOSHI_WEBHOOK_TOKEN` and provide the value only through the command's stdin pipe/session. Do not use `--body`, a shell literal, a temporary file, command tracing, or log output.
- [ ] Run `pnpm github:governance:apply` against `hmmhmmhm/ground.codes` with normal output limited to setting names, ruleset ID, and enabled/disabled state.
- [ ] Run `pnpm github:governance:verify`; expect an active `main-protection` ruleset, required `verify`, strict up-to-date enforcement, no force push/deletion, security features enabled, Dependabot security updates enabled, and automatic merged-branch deletion enabled.
- [ ] Record the ruleset ID, verification timestamp, and GitHub API URLs in `docs/security/dependency-audit.md`; record only the presence of secret names, never values.
- [ ] Commit the evidence update as `docs(security): record repository controls`.

### Task 8: Complete the security stage gate

**Files:**

- Modify: this plan

- [ ] Run `pnpm install --frozen-lockfile` and verify no changes to `pnpm-lock.yaml`.
- [ ] Run `pnpm security:audit`, `pnpm scripts:test`, `pnpm --filter api-ground-codes test`, `pnpm --filter web test`, `pnpm check-types`, and `pnpm build`; expect every command PASS.
- [ ] Run `git grep -nE 'uses: [^ ]+@v[0-9]|\"latest\"|: latest$' -- .github apps packages package.json`; expect no mutable runtime/action pins, allowing ordinary prose uses of the English word “latest”.
- [ ] Mark all completed checkboxes in this plan and commit as `docs: complete security governance plan`.
