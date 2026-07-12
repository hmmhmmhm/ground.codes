# Metrics, Documentation, and CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Cloudflare isolate-related production smoke flakiness, align public documentation with the deployed 180-language architecture, and enforce format/lint/build checks in CI.

**Architecture:** Keep lightweight request metrics local to each Worker isolate and make that scope explicit. Production smoke validates the snapshot contract instead of assuming cross-request isolate affinity. Repository-level scripts expose non-mutating quality gates that CI runs before expensive data and browser tests.

**Tech Stack:** TypeScript, Node.js test runner, Bun test, Elysia, pnpm, Turborepo, GitHub Actions, Prettier.

---

### Task 1: Define the isolate-aware metrics snapshot contract

**Files:**

- Modify: `scripts/production-smoke.test.mjs`
- Modify: `scripts/production-smoke-helpers.mjs`

- [ ] **Step 1: Replace the route-affinity test with failing snapshot tests**

Update the helper import to use `validateMetricsSnapshot`, then add these tests:

```js
test("accepts an empty Worker-isolate metrics snapshot", () => {
  assert.deepEqual(
    validateMetricsSnapshot({
      service: "api-ground-codes",
      scope: "worker-isolate",
      uptimeSeconds: 0,
      requests: { total: 0, avgMs: 0, byPath: {}, routes: {} },
    }),
    [],
  );
});

test("reports invalid metrics snapshot fields", () => {
  assert.deepEqual(
    validateMetricsSnapshot({
      service: "api-ground-codes",
      scope: "global",
      uptimeSeconds: -1,
      requests: { total: -1, avgMs: "fast", byPath: [], routes: null },
    }),
    [
      'scope must be "worker-isolate"',
      "uptimeSeconds must be a non-negative number",
      "requests.total must be a non-negative number",
      "requests.avgMs must be a non-negative number",
      "requests.byPath must be an object",
      "requests.routes must be an object",
    ],
  );
});
```

- [ ] **Step 2: Run the helper test and verify RED**

Run: `node --test scripts/production-smoke.test.mjs`

Expected: FAIL because `validateMetricsSnapshot` is not exported.

- [ ] **Step 3: Implement the snapshot validator**

Replace `getMissingMetricRoutes` with a `validateMetricsSnapshot(metrics)` export. It returns an array of exact error strings and uses a local `isRecord` helper:

```js
const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isNonNegativeNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export const validateMetricsSnapshot = (metrics) => {
  const errors = [];
  if (metrics?.scope !== "worker-isolate") {
    errors.push('scope must be "worker-isolate"');
  }
  if (!isNonNegativeNumber(metrics?.uptimeSeconds)) {
    errors.push("uptimeSeconds must be a non-negative number");
  }
  if (!isNonNegativeNumber(metrics?.requests?.total)) {
    errors.push("requests.total must be a non-negative number");
  }
  if (!isNonNegativeNumber(metrics?.requests?.avgMs)) {
    errors.push("requests.avgMs must be a non-negative number");
  }
  if (!isRecord(metrics?.requests?.byPath)) {
    errors.push("requests.byPath must be an object");
  }
  if (!isRecord(metrics?.requests?.routes)) {
    errors.push("requests.routes must be an object");
  }
  return errors;
};
```

- [ ] **Step 4: Run the helper test and verify GREEN**

Run: `node --test scripts/production-smoke.test.mjs`

Expected: all production smoke helper tests pass.

- [ ] **Step 5: Commit the contract helper**

```bash
git add scripts/production-smoke.test.mjs scripts/production-smoke-helpers.mjs
git commit -m "test(smoke): define isolate metrics contract"
```

### Task 2: Expose and consume isolate scope

**Files:**

- Modify: `apps/api-ground-codes/src/app.test.ts`
- Modify: `apps/api-ground-codes/src/endpoints/metrics.ts`
- Modify: `scripts/production-smoke.mjs`

- [ ] **Step 1: Add a failing API contract assertion**

In `serves lightweight operational metrics`, assert:

```ts
expect(body.scope).toBe("worker-isolate");
```

- [ ] **Step 2: Run the focused API test and verify RED**

Run: `pnpm --filter api-ground-codes test -- --test-name-pattern "lightweight operational metrics"`

Expected: FAIL because the response does not have `scope`.

- [ ] **Step 3: Return the scope from `/metrics`**

Add the field next to `service`:

```ts
return {
  service: "api-ground-codes",
  scope: "worker-isolate",
  startedAt: requestMetrics.startedAt,
  // existing fields
};
```

- [ ] **Step 4: Replace the smoke route-affinity assertion**

Import `validateMetricsSnapshot`, rename the smoke check to `API metrics snapshot`, and validate the fetched payload:

```js
await smoke.check("API metrics snapshot", async () => {
  const metrics = JSON.parse(await fetchText(`${apiBaseUrl}/metrics`));
  assert(metrics.service === "api-ground-codes", "unexpected metrics service");
  const errors = validateMetricsSnapshot(metrics);
  assert(errors.length === 0, `invalid metrics snapshot: ${errors.join("; ")}`);
});
```

- [ ] **Step 5: Run focused and helper tests**

Run:

```bash
pnpm --filter api-ground-codes test -- --test-name-pattern "lightweight operational metrics"
node --test scripts/production-smoke.test.mjs
```

Expected: both commands pass.

- [ ] **Step 6: Commit the runtime change**

```bash
git add apps/api-ground-codes/src/app.test.ts apps/api-ground-codes/src/endpoints/metrics.ts scripts/production-smoke.mjs
git commit -m "fix(smoke): respect Worker isolate metrics"
```

### Task 3: Align public documentation

**Files:**

- Modify: `README.md`
- Modify: `apps/api-ground-codes/README.md`
- Modify: `docs/language-expansion-180.md`
- Modify: `docs/language-native-review-backlog.md`
- Modify: `apps/api-ground-codes/src/endpoints/docs.ts`
- Modify: `apps/api-ground-codes/src/app.test.ts`

- [ ] **Step 1: Add failing documentation assertions**

Extend the API docs test with:

```ts
expect(firstPartyDocs).toContain("Worker-isolate metrics");
expect(firstPartyDocs).toContain("180 automated-stable language sets");
```

- [ ] **Step 2: Run the API docs test and verify RED**

Run: `pnpm --filter api-ground-codes test -- --test-name-pattern "public API documentation"`

Expected: FAIL because the phrases are absent.

- [ ] **Step 3: Update API documentation content**

In the monitoring section, state that `/metrics` contains Worker-isolate counters and is not a globally aggregated request history. In the language section, state that 180 sets satisfy automated structural and quality gates while native-speaker review is ongoing.

- [ ] **Step 4: Update repository documentation consistently**

Replace the root README's 11-language/60-language statements with 180 automated-stable language sets. Update the comparison and technical-detail sections to use the same wording. In `language-expansion-180.md`, replace the final paragraph with:

```md
All 180 languages meet the repository's automated `stable` gate. Here,
`stable` means structural, regression, and minimum-score checks pass; it does
not mean native-speaker certification. Native-speaker review remains ongoing
maintenance tracked in `docs/language-native-review-backlog.md`.
```

- [ ] **Step 5: Run documentation tests and format checks for touched files**

Run:

```bash
pnpm --filter api-ground-codes test -- --test-name-pattern "public API documentation"
pnpm exec prettier --check README.md apps/api-ground-codes/README.md docs/language-expansion-180.md docs/language-native-review-backlog.md apps/api-ground-codes/src/endpoints/docs.ts apps/api-ground-codes/src/app.test.ts
```

Expected: both commands pass.

- [ ] **Step 6: Commit documentation alignment**

```bash
git add README.md apps/api-ground-codes/README.md docs/language-expansion-180.md docs/language-native-review-backlog.md apps/api-ground-codes/src/endpoints/docs.ts apps/api-ground-codes/src/app.test.ts
git commit -m "docs: align production and language status"
```

### Task 4: Add format, lint, and build quality gates

**Files:**

- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `scripts/qa-workflows.test.mjs`

- [ ] **Step 1: Add failing workflow assertions**

Add a test that reads `.github/workflows/ci.yml` and asserts the commands are present:

```js
test("enforces format lint and build gates in CI", () => {
  const workflow = readFileSync(
    resolve(repoRoot, ".github/workflows/ci.yml"),
    "utf8",
  );
  for (const command of ["pnpm format:check", "pnpm lint", "pnpm build"]) {
    assert.match(workflow, new RegExp(command.replaceAll(":", "\\:")));
  }
});
```

- [ ] **Step 2: Run the workflow test and verify RED**

Run: `node --test scripts/qa-workflows.test.mjs`

Expected: FAIL because the commands are not in CI.

- [ ] **Step 3: Add package scripts**

Add:

```json
"format:check": "prettier --check \"**/*.{ts,tsx,md}\""
```

- [ ] **Step 4: Add format, lint, and build CI steps**

Place format immediately after dependency installation, lint before type checking, and build after unit tests.

- [ ] **Step 5: Run workflow and JSON validation**

Run:

```bash
node --test scripts/qa-workflows.test.mjs
pnpm exec prettier --check package.json .github/workflows/ci.yml scripts/qa-workflows.test.mjs
```

Expected: both commands pass.

- [ ] **Step 6: Commit the CI gate wiring**

```bash
git add package.json .github/workflows/ci.yml scripts/qa-workflows.test.mjs
git commit -m "ci: enforce repository quality gates"
```

### Task 5: Mechanically format the repository

**Files:**

- Modify: all files reported by `pnpm format:check`

- [ ] **Step 1: Capture the failing format gate**

Run: `pnpm format:check`

Expected: FAIL and report the existing 67 files.

- [ ] **Step 2: Apply only Prettier's mechanical rewrite**

Run: `pnpm format`

Expected: Prettier rewrites supported TypeScript, TSX, and Markdown files.

- [ ] **Step 3: Verify formatting and inspect scope**

Run:

```bash
pnpm format:check
git diff --stat
git diff --check
```

Expected: format check passes; diff contains formatting-only changes with no whitespace errors.

- [ ] **Step 4: Re-run behavior gates affected by formatted source**

Run:

```bash
pnpm lint
pnpm check-types
pnpm --filter web test
node --test scripts/production-smoke.test.mjs scripts/qa-workflows.test.mjs
```

Expected: all commands pass.

- [ ] **Step 5: Commit the mechanical change separately**

```bash
git add --all
git commit -m "style: format repository sources"
```

### Task 6: Verify this plan's completed slice

**Files:**

- Verify only

- [ ] **Step 1: Run the slice verification suite**

Run:

```bash
pnpm format:check
pnpm lint
pnpm check-types
pnpm --filter web test
node --test scripts/production-smoke.test.mjs scripts/qa-workflows.test.mjs
pnpm build
git status --short
```

Expected: every command exits zero and the worktree is clean.

- [ ] **Step 2: Record the plan checkpoint**

Update this plan's checkboxes to reflect executed steps and commit the plan-state update together with the next implementation checkpoint rather than creating a documentation-only completion commit.
