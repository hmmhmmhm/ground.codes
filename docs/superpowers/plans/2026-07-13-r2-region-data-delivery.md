# R2 Region Data Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the 8.35 GiB region dataset as immutable, content-addressed Cloudflare R2 releases; prove complete hash-equivalent materialization; then remove `region-dist` and `region-db` from the current Git tree without rewriting history.

**Architecture:** A deterministic manifest maps repository-relative logical files to gzip-compressed SHA-256 object keys. A read-only synchronizer verifies the committed release pointer and every downloaded uncompressed object before atomic placement. Publication is append-only and writes the manifest last. The migration has an enforced shadow phase with Git data retained, followed by a separate R2-only cutover after merged CI/deploy evidence exists.

**Tech Stack:** Node.js ESM and built-ins, gzip/SHA-256, `@aws-sdk/client-s3` 3.1085.0, Cloudflare R2, pnpm, GitHub Actions, PostGIS import tooling.

**Execution Order:** Run after the security, metrics/smoke, and CI/deploy/coverage plans. Phase A and Phase B are separate merge/deploy gates and must not be collapsed.

---

### Task 1: Specify and validate the manifest model

**Files:**

- Create: `scripts/region-data/manifest.mjs`
- Create: `scripts/region-data/manifest.test.mjs`
- Create: `scripts/region-data/fixtures/region-dist/sample.json`
- Create: `scripts/region-data/fixtures/region-db/sample.index`
- Create: `scripts/region-data/fixtures/region-db/sample/000001.log`
- Modify: `scripts/code-size-policy.test.mjs`
- Modify: `package.json`

- [x] Write tests for stable logical-path ordering, binary-safe SHA-256, uncompressed/compressed sizes, group assignment, duplicate-content object-key reuse, content-derived release version, canonical JSON serialization, and rejection of paths outside `region-dist`/`region-db`.
- [x] Define this versioned document shape in the tests:

  ```js
  {
    schemaVersion: 1,
    version: "sha256-<64 lowercase hex characters>",
    entries: [
      {
        path: "packages/geoint/region-dist/sample.json",
        group: "region-dist",
        size: 123,
        compressedSize: 91,
        sha256: "<64 lowercase hex characters>",
        objectKey: "releases/<version>/objects/<sha256>.json.gz"
      }
    ]
  }
  ```

- [x] Run `node --test scripts/region-data/manifest.test.mjs`; expect RED because the module is absent.
- [x] Implement deterministic recursive enumeration of regular files only. Reject symlinks, sockets, traversal, absolute paths, duplicate logical paths, unsupported schema versions, and malformed hashes.
- [x] Compute `version` from canonical entry metadata before release-prefixing object keys so the algorithm has no circular dependency. Do not include timestamps, host paths, usernames, or compression timestamps in the version input.
- [x] Keep every new maintained module below 450 lines and add the new directory to the source-size boundary test.
- [x] Expand root `scripts:test` to `node --test scripts/*.test.mjs scripts/region-data/*.test.mjs` so nested region-data contracts are mandatory in CI.
- [x] Run manifest and source-size tests; expect PASS.
- [x] Commit as `test(region-data): define immutable manifest contract`.

### Task 2: Generate deterministic compressed release artifacts

**Files:**

- Create: `scripts/region-data/generate-release.mjs`
- Create: `scripts/region-data/generate-release.test.mjs`
- Create: `scripts/generate-region-data-release.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

- [x] Write tests that generate the same release twice and compare manifest bytes, object bytes, version, and deduplication. Change one source byte and assert only its hash object and release version change.
- [x] Run the generator tests; expect RED.
- [x] Gzip every regular file with deterministic metadata and write each unique object once under `.region-data-staging/releases/<version>/objects/<sha256>.json.gz`. The `.json.gz` suffix is retained for the approved object contract even when a `region-db` logical file contains binary LevelDB data.
- [x] Write `.region-data-staging/releases/<version>/manifest.json` only after all objects exist, and calculate a separate SHA-256 over the final manifest bytes.
- [x] Make the CLI accept only explicit arguments:

  ```sh
  node scripts/generate-region-data-release.mjs \
    --source packages/geoint \
    --staging .region-data-staging \
    --pointer-out packages/geoint/region-data-release.json
  ```

- [x] The pointer output must be small and canonical:

  ```js
  {
    schemaVersion: 1,
    version: manifest.version,
    manifestSha256,
  }
  ```

- [x] Add `.region-data-staging/` to `.gitignore` and root script `region-data:generate` for the exact CLI above.
- [x] Run tests; expect PASS.
- [x] Commit as `feat(region-data): generate content-addressed releases`.

### Task 3: Build a fail-closed synchronizer

**Files:**

- Create: `scripts/region-data/sync.mjs`
- Create: `scripts/region-data/sync.test.mjs`
- Create: `scripts/sync-region-data.mjs`
- Modify: `package.json`

- [x] Test against a local HTTP server for: valid full download, already-valid skip, corrupt-local replacement, manifest hash mismatch, object hash mismatch, truncated gzip, 404, retryable 429/5xx, bounded concurrency, group scope, explicit-path scope, atomic temp rename, default no-prune, and explicit prune.
- [x] Add traversal and malicious-manifest tests proving no write can escape the requested root.
- [x] Run `node --test scripts/region-data/sync.test.mjs`; expect RED.
- [x] Implement pointer validation first, then download `releases/<version>/manifest.json` from `REGION_DATA_BASE_URL`, verify `manifestSha256`, validate every entry, and select entries by `--groups` or repeated `--path` flags.
- [x] For each selected entry, skip an existing matching file; otherwise stream the gzip object to a sibling temporary file, decompress while hashing/counting uncompressed bytes, verify size/SHA-256, fsync/close, then atomically rename. Remove temporary files on all failures.
- [x] Use default concurrency 4, three attempts, and bounded exponential backoff. Retry network errors, 429, and 5xx only. Fail immediately for other 4xx, schema, hash, size, path, or decompression errors.
- [x] Default behavior must never delete files. `--prune` removes only files under the selected managed group roots that are absent from the verified manifest; reject prune with an explicit-path-only scope.
- [x] Add root scripts:

  ```json
  "region-data:sync": "node scripts/sync-region-data.mjs --groups region-dist,region-db",
  "region-data:sync:ci": "node scripts/sync-region-data.mjs --groups region-dist,region-db --prune"
  ```

- [x] Run synchronizer tests and an offline fixture sync; expect PASS.
- [x] Commit as `feat(region-data): add verified r2 synchronizer`.

### Task 4: Implement immutable R2 publication

**Files:**

- Create: `scripts/region-data/publish.mjs`
- Create: `scripts/region-data/publish.test.mjs`
- Create: `scripts/publish-region-data.mjs`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [x] Add exact development dependency `@aws-sdk/client-s3@3.1085.0`.
- [x] Write publisher tests with a fake S3 client for missing-object upload, existing-object skip, metadata mismatch failure, bounded multipart/concurrent upload behavior, retry, manifest-last ordering, existing-manifest immutability, and no credential logging.
- [x] Run publisher tests; expect RED.
- [x] Configure the S3 client from `CLOUDFLARE_ACCOUNT_ID`, `R2_REGION_DATA_ACCESS_KEY_ID`, and `R2_REGION_DATA_SECRET_ACCESS_KEY`, using endpoint `https://<account>.r2.cloudflarestorage.com`, region `auto`, and bucket `ground-codes-region-data`. Fail before network access if any credential is absent.
- [x] HEAD each unique hash object; upload only absent objects with immutable cache metadata. Treat a conflicting size/metadata response as fatal rather than overwriting.
- [x] Upload `releases/<version>/manifest.json` only after all objects succeed. If the manifest already exists, download/compare exact bytes and succeed only on equality.
- [x] Print only counts, bytes, version, and object keys; never print S3 request headers, secret values, or the environment.
- [x] Add root `region-data:publish` command targeting `.region-data-staging`.
- [x] Run publisher tests; expect PASS.
- [x] Commit as `feat(region-data): publish immutable r2 releases`.

### Task 5: Add whole-release verification independent of sync

**Files:**

- Create: `scripts/region-data/verify.mjs`
- Create: `scripts/region-data/verify.test.mjs`
- Create: `scripts/verify-region-data.mjs`
- Modify: `package.json`
- Modify: `scripts/coverage-policy.json`
- Modify: `docs/quality/coverage.md`

- [x] Write tests that compare source and materialized trees by path, group, byte size, and SHA-256; cover missing, extra, changed, and permission/read failures.
- [x] Implement `region-data:verify` to support both source-vs-materialized shadow verification and manifest-vs-materialized verification. Extra managed files fail in exact mode.
- [x] Emit a compact result with version, entry count, group counts, bytes, and mismatches; never dump dataset content.
- [x] Extend `coverage:operations` and its policy include list with `manifest.mjs`, `generate-release.mjs`, `sync.mjs`, `publish.mjs`, and `verify.mjs`. Keep line/function floors at 80%, measure the expanded target's branch ratio, and raise or preserve—not lower—the committed branch floor. Record the expanded boundary and result in `docs/quality/coverage.md`.
- [x] Run all region-data tests; expect PASS.
- [x] Commit as `test(region-data): verify complete release materialization`.

### Task 6: Provision the R2 read/write boundary and GitHub settings

**Files:**

- Create: `docs/operations/region-data-delivery.md`

- [x] Create the bucket with `pnpm exec wrangler r2 bucket create ground-codes-region-data` and verify it exists with `pnpm exec wrangler r2 bucket list`.
- [x] Configure the public read custom domain `region-data.ground.codes` for this bucket while retaining private writes. Verify HTTPS GET is available only for published object paths; bucket listing is not exposed.
- [x] Create a least-privilege R2 S3 token scoped only to object read/write for `ground-codes-region-data`.
- [x] Store `CLOUDFLARE_ACCOUNT_ID` at repository scope and the two R2 write credentials in the protected `region-data-publisher` environment through stdin sessions; store `REGION_DATA_BASE_URL=https://region-data.ground.codes` as a GitHub Actions variable. Never pass secret values in command arguments or repository files.
- [x] Document bucket, domain, credential scope, rotation steps, variable/secret names, and rollback behavior. Record secret presence only.
- [x] Verify with GitHub/Cloudflare APIs that the names and endpoint exist without returning credential values.
- [x] Commit as `docs(region-data): document r2 delivery operations`.

### Task 7: Publish the current Git-backed release and shadow-verify it

**Files:**

- Create: `packages/geoint/region-data-release.json`
- Modify: `docs/operations/region-data-delivery.md`

- [x] Materialize the current `main` data in an isolated full worktree and verify the source inventory is 901 `region-dist` files plus 1,130 `region-db` files before publication. Stop if the authoritative source differs unexpectedly.
- [x] Run `pnpm region-data:generate`; expect one content-derived version, 2,031 logical entries, deduplicated gzip objects, and a small pointer file.
- [x] Run `pnpm region-data:publish`; expect all missing objects first and the manifest last. Re-run it and expect an idempotent zero-object upload.
- [x] Sync that version into an empty temporary directory with public read credentials only:

  ```sh
  REGION_DATA_BASE_URL=https://region-data.ground.codes \
    node scripts/sync-region-data.mjs \
    --root /tmp/ground-codes-region-shadow \
    --groups region-dist,region-db --prune
  ```

- [x] Run source-vs-shadow verification; expect 2,031 matching logical paths and zero missing/extra/hash/size mismatches.
- [x] Delete the temporary materialization, repeat once from an empty directory, and verify again to rule out accidental local fallback.
- [x] Commit the real pointer and evidence as `feat(region-data): publish initial r2 release`.

### Task 8: Use R2 in CI/deploy while Git data remains available (Phase A)

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy-api.yml`
- Modify: `.github/workflows/visual-qa.yml`
- Modify: `apps/api-ground-codes/scripts/list-changed-region-datasets.mjs`
- Create: `apps/api-ground-codes/scripts/list-changed-region-datasets.test.mjs`
- Modify: `scripts/qa-workflows.test.mjs`
- Modify: `README.md`
- Modify: `packages/geoint/README.md`

- [x] Add workflow tests requiring a verified sync before any data audit/test/import and requiring `REGION_DATA_BASE_URL` from repository variables. Public PR CI must not reference R2 write secrets.
- [x] Update CI to run `node scripts/sync-region-data.mjs --groups region-dist,region-db --prune` before tests. During Phase A this validates/replaces the checked-out copies but does not yet reduce checkout size.
- [x] Update API deploy to sync both `region-dist` and the test-required `region-db` before changed-dataset detection, API tests, PostGIS import, or build. Keep database deployment concurrency non-cancelling.
- [x] Change changed-dataset detection to compare old/new release manifests by logical `region-dist` entry hash when the pointer changes. Preserve `__all_missing__` for manual imports and return empty when the release pointer is unchanged.
- [x] Add focused tests for added, removed, and changed dataset hashes and for unavailable prior manifests. Fail closed rather than silently importing nothing.
- [x] Add local setup instructions: clone, frozen install, `REGION_DATA_BASE_URL=... pnpm region-data:sync`, tests/build. State that generators require an explicitly materialized working tree.
- [x] Run workflow, detector, sync, full test, coverage, and build commands locally; expect PASS.
- [x] Commit as `ci(region-data): shadow materialize from r2`.

### Task 9: Prove Phase A on merged main before any deletion

**Files:**

- Modify: `docs/operations/region-data-delivery.md`

- [x] Open the Phase A pull request and require green `verify`, including R2 sync, all data/language audits, unit tests, coverage, build, and browser smoke.
- [x] Merge Phase A with Git data still tracked. Record the merged commit and successful merged-main CI URL.
- [x] Confirm API, Web, and Grok Spiral deploy workflows succeed for that commit where applicable; run/record the full post-deploy production smoke.
- [x] Run a clean public-URL shadow sync after merge and verify every manifest entry/hash again.
- [x] Record the successful run URLs and hashes. Do not begin Task 10 if any Phase A check is missing or failed.
- [x] Commit the evidence update on a fresh Phase B branch as `docs(region-data): record shadow rollout evidence`.

### Task 10: Remove managed data from the current Git tree (Phase B)

**Files:**

- Delete: `packages/geoint/region-dist/**`
- Delete: `packages/geoint/region-db/**`
- Modify: `.gitignore`
- Modify: `packages/geoint/package.json`
- Modify: `packages/geoint/src/index.ts`
- Modify: `packages/geoint/README.md`
- Modify: `README.md`
- Modify: `.github/workflows/deploy-api.yml`
- Modify: `scripts/language-support-completeness.test.mjs`
- Modify: all generators/audits found by `rg -l 'packages/geoint/region-(dist|db)' scripts packages apps .github`

- [x] Add a failing repository contract that asserts neither managed directory is tracked by `git ls-files`, both are ignored materialization targets, and the pointer/fixtures remain tracked.
- [x] Run the contract test; expect RED while Git data remains.
- [x] Add `/packages/geoint/region-dist/` and `/packages/geoint/region-db/` to `.gitignore`; remove those paths from the geoint package `files` array and include `region-data-release.json` plus sync/setup documentation.
- [x] Allow `@ground-codes/geoint.load` to receive an explicit `dataDir` (defaulting to the materialized package path or `GROUND_CODES_REGION_DB_DIR`) and throw a clear sync instruction when required data is absent. Never download implicitly at runtime.
- [x] Update generators, audits, PostGIS tooling, runtime-pin package assembly, and workflows to call the synchronizer explicitly before reading data. Keep their logical paths unchanged after materialization to minimize consumer changes.
- [x] Replace API deploy path triggers for deleted directories with the release pointer, manifest/sync scripts, generator/source inputs, and publication workflow.
- [x] Remove the managed directories from the Git index in one dedicated commit without history rewriting. Do not delete `region-dataset` sources, tiny test fixtures, or the active pointer.
- [x] Run the repository contract after removal; expect PASS.
- [x] Commit as `chore(region-data): remove generated datasets from git tree`.

### Task 11: Verify a fresh R2-only checkout

**Files:**

- Create: `scripts/region-data/fresh-checkout.mjs`
- Create: `scripts/region-data/fresh-checkout.test.mjs`
- Modify: `scripts/qa-workflows.test.mjs`
- Modify: `docs/operations/region-data-delivery.md`

- [x] Unit-test command construction and cleanup with a tiny local fixture repository. Implement the opt-in verification script to create a clean temporary checkout of the Phase B commit with no shared untracked data, assert both managed directories are initially absent, sync from the public URL, and verify the release. Do not run the 8.35 GiB network verification from the ordinary `scripts:test` glob.
- [x] In that clean checkout run frozen install, format check, source-size check, security audit, operational scripts, data/language audits, lint, type checks, all unit/coverage tests, build, and browser smoke.
- [x] Run API Worker dry-run packaging and confirm the sync happens before PostGIS detection/import. Do not mutate production in this step.
- [x] Delete managed directories again and prove a second sync reconstructs the same file count and hashes.
- [x] Record command output summaries and version/hash in the operations document.
- [x] Commit as `test(region-data): prove fresh r2-only checkout`.

### Task 12: Add the protected future publication workflow

**Files:**

- Create: `.github/workflows/publish-region-data.yml`
- Create: `scripts/region-data/publish-workflow.test.mjs`
- Modify: `docs/operations/region-data-delivery.md`

- [x] Add workflow tests requiring manual dispatch, minimal `contents: write`/`pull-requests: write`, `environment: region-data-publisher`, pinned actions, frozen install, active-release sync, all data quality audits, immutable publication, pointer-only commit validation, and pull request creation.
- [x] Implement the workflow on `main`: sync the active release; run approved generators/source transformations already committed to main; run data/language tests; generate and publish a new immutable release; verify a clean materialization; commit only `packages/geoint/region-data-release.json` and documentation; push `data-release/<version>`; open a PR with `gh pr create`.
- [x] Reject a release branch if `git diff --cached --name-only` includes materialized `region-dist`/`region-db`, credentials, staging files, or unrelated source changes.
- [x] Give the publisher environment access to R2 write secrets; keep normal CI and pull requests read-only/public.
- [x] Test a no-content-change dispatch and require it to exit successfully without publishing or opening a PR. Record a separate non-production-bucket fixture as a hard prerequisite before the first content-changing production dispatch; no such production dispatch is part of this cutover.
- [x] Run workflow-contract tests; expect PASS.
- [x] Commit as `ci(region-data): add protected publication workflow`.

### Task 13: Merge Phase B and complete the R2 stage gate

**Files:**

- Modify: this plan
- Modify: `docs/operations/region-data-delivery.md`

- [x] Open the Phase B pull request and verify authoritative CI starts from a checkout where managed directories are absent, materializes from R2, and passes every format/security/data/test/coverage/build/browser gate.
- [x] Merge only after green CI. Verify every API, Web, and Grok Spiral deployment selected by the Phase B and deployment-hotfix path filters succeeds.
- [x] Run and record full post-deploy production smoke. Verify `/metrics` reports the merged commit and realistic uptime.
- [x] Use GitHub APIs to confirm the release pointer is tracked, managed directories are absent from the current tree, rules/security settings remain enabled, and required checks are green.
- [x] Perform one final clean R2 materialization and manifest-vs-filesystem hash verification; expect 2,031 entries unless a documented Phase A source change intentionally changed the inventory.
- [x] Verify the retained immutable R2 release remains readable. Because it is the first and only pointer at this gate, document how a future predecessor is restored in a normal PR after a successor exists.
- [x] Mark all checkboxes and commit as `docs: complete r2 region data delivery plan`.
