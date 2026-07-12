# Repository Hardening Design

## Goal

Bring `ground.codes` from a working production project to a consistently
verifiable, documented, and maintainable state. The work covers production
smoke reliability, current documentation, formatting and CI enforcement,
source-file size compliance, stale branch cleanup, full-data verification, and
desktop/mobile visual QA.

## Current State

- `main` is deployed and its latest CI run is green.
- Production smoke succeeds most of the time, but issue #65 records intermittent
  failures when `/metrics` does not contain samples from earlier smoke requests.
- The API runs on Cloudflare Workers. Request metrics are stored in module-local
  memory and therefore describe one Worker isolate, not a globally aggregated
  service view.
- The 180-language structural and automated quality gates are complete, while
  native-speaker review remains ongoing maintenance.
- The root README still describes the older 11-language and 60-language target.
- Prettier reports 67 nonconforming files, and CI does not run format, lint, or
  build gates.
- Thirty-five checked-in TypeScript, TSX, or MJS files exceed the stated
  450-line policy. One large landmark-label module is generated output; the
  remaining oversized files require either decomposition or a narrowly defined
  generated/fixture exception.
- Fourteen remote branches are unmerged and stale. Their functionality appears
  to have been superseded, but deletion requires branch-by-branch evidence.
- The local disk cannot currently hold dependencies plus the complete 8.35 GiB
  generated geoint checkout, so development uses sparse checkout temporarily.

## Architecture and Work Breakdown

### 1. Isolate-aware operational metrics

`GET /metrics` will explicitly return `scope: "worker-isolate"`. The endpoint
continues to expose lightweight counters without adding a database or Durable
Object dependency. This keeps the endpoint cheap and accurately describes the
data it already provides.

Production smoke will verify:

- the endpoint is reachable and identifies `api-ground-codes`;
- `scope` is `worker-isolate`;
- request totals and route maps have the documented object/number shapes; and
- any routes that are present have valid non-negative counters.

Production smoke will not require its preceding requests to appear in the same
isolate's counters. Local API tests remain responsible for proving that a single
app instance records `/readyz`, `/v1/encode`, and `/v1/search` correctly. This
separates distributed availability monitoring from per-process instrumentation.

The change will be developed test-first by replacing the route-presence helper
contract with a metrics-snapshot validation contract. The old production
failure fixture must fail before implementation and pass afterward.

### 2. Documentation and quality gates

The root and API READMEs will describe:

- 180 structurally complete and automated-stable language sets;
- ongoing native-speaker review as a non-structural quality program;
- Earth, Moon, and Mars support;
- Cloudflare Workers plus Supabase/PostGIS as production architecture; and
- Worker-isolate semantics for the lightweight metrics endpoint.

Language documents will use one definition: `stable` means the automated score
and regression gates pass; it does not claim native-speaker certification.

The root package will add non-mutating `format:check` and `code:size-check`
commands. CI will run format, size, lint, type, test, and build gates. The API
build will declare its real output so Turbo no longer emits the missing-output
warning.

The existing 67 formatting violations will be fixed in one mechanical commit,
separate from behavioral changes.

### 3. Source-file size policy

The 450-line policy will be machine-enforced for maintained source files.

Generated data modules and large review fixtures may be exempt only when all of
the following are true:

- the file is reproducible from a checked-in generator or is explicitly a test
  fixture/review record;
- the file contains or is paired with a clear generated/fixture declaration;
- the exception is listed with a reason in the size-check configuration; and
- the generator or consuming code remains subject to the 450-line limit.

Maintained production modules and generator scripts will be split by cohesive
responsibility. Public exports and runtime behavior must remain compatible.
Tests may be split by scenario without changing assertions. The checker itself
will have tests proving that an oversized maintained file fails, a normal file
passes, and only declared generated/fixture exceptions are accepted.

Because the existing debt spans several independent areas, decomposition will
be done in small commits grouped by subsystem: metrics/API, web maps, core
encoding, codebook generators/audits, and test suites.

### 4. Repository and storage hygiene

Each stale branch will be recorded in a branch audit with:

- branch name and tip SHA;
- unique commits;
- the `main` files or commits that supersede its behavior; and
- a delete/retain decision.

Only branches with positive supersession evidence will be deleted. The audit
remains in the repository so deleted work can be traced by SHA. No force pushes
or history rewrites are allowed.

Disk cleanup is limited to reproducible artifacts and caches: `node_modules`,
Turbo/Next/build outputs, and package-manager caches. User source files and
other projects are out of scope. Once sufficient space exists, sparse checkout
will be disabled in the verification worktree and dependencies reinstalled.

### 5. Verification, visual QA, and release

The complete checkout must pass:

1. `pnpm install --frozen-lockfile`
2. `pnpm format:check`
3. `pnpm code:size-check`
4. `pnpm lint`
5. `pnpm check-types`
6. `pnpm scripts:test`
7. `pnpm language:audit`
8. `pnpm --filter ground-codes test`
9. `pnpm --filter ground-codes test:standalone`
10. `pnpm --filter api-ground-codes test`
11. `pnpm --filter web test`
12. `pnpm build`
13. the browser smoke suite

Visual QA will inspect production-equivalent desktop and mobile widths for
Earth, Moon, and Mars. It will verify the initial view, landmark labels, grid,
marker selection, compass behavior, attribution, encoding panel, and control
overlap. Screenshots will be retained as workflow or local test artifacts.

Changes will be pushed through a pull request. After CI is green, the branch is
merged, relevant deployments complete, and production smoke succeeds. Issue
#65 is closed only after the new smoke semantics are deployed and consecutive
scheduled or manually triggered runs pass.

## Error Handling and Rollback

- Metrics validation reports the exact invalid field instead of a generic route
  absence message.
- A failed CI or visual check blocks merge; no bypass is used.
- Branch deletion occurs after the implementation PR is merged and after the
  audit is committed.
- Deleted branches remain recoverable by the recorded tip SHA.
- If a full checkout cannot be completed after safe cache cleanup, verification
  continues in GitHub Actions while the local disk limitation is reported; the
  goal is not marked complete until authoritative full-data CI and visual
  evidence are available.

## Success Criteria

- Production smoke no longer assumes cross-isolate metric aggregation and issue
  #65 has verifiable post-deploy green runs.
- README and language/API documentation match the 180-language production
  architecture and use a consistent stability definition.
- Format, size, lint, type, test, and build gates are enforced in CI.
- Every maintained source file satisfies the 450-line limit; every remaining
  oversized checked-in file is an explicitly justified generated artifact or
  fixture.
- All safely superseded remote branches are deleted and the decisions are
  auditable.
- Full-data automated verification and desktop/mobile planetary visual QA pass.
- The merged production revision is healthy on Web, API, and Grok Spiral.
