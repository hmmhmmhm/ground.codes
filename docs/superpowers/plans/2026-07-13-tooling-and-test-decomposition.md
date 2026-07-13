# Tooling and Test Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring every remaining maintained source file below the repository's 450-line limit without weakening generation, policy-audit, smoke-test, or test coverage behavior.

**Architecture:** Large literal dictionaries and language specifications move into focused data modules, split by language or semantic wave. Generator entry points retain orchestration only. Large tests move shared fixtures into helper modules and split assertions into topic-oriented suites. Every extracted JavaScript or TypeScript module remains subject to the same 450-line policy.

**Tech Stack:** Node.js ESM, TypeScript, Node test runner, Bun tests, pnpm workspace scripts.

---

### Task 1: Define the tooling and test source boundary

**Files:**

- Modify: `scripts/code-size-policy.test.mjs`

- [x] Add every currently oversized generator, policy, smoke, research, and test entry point to a maintained-source boundary assertion.
- [x] Run the policy test and verify RED reports the known oversized files.
- [x] Commit the failing contract.

### Task 2: Extract compact generator data sets

**Files:**

- Modify: `scripts/generate-planetary-landmark-labels.mjs`
- Modify: `scripts/generate-candidate-language-codebooks.mjs`
- Modify: `scripts/generate-major-european-codebooks.mjs`
- Modify: `scripts/codebook-policy-findings.mjs`
- Modify: `scripts/codebook-type-inventory.mjs`
- Create: focused modules under `scripts/data/`

- [x] Move literal tables into semantic modules below 450 lines.
- [x] Preserve exported values and generator output byte-for-byte where practical.
- [x] Run focused tests and generation dry runs.

### Task 3: Extract language-support generator data

**Files:**

- Modify: `scripts/generate-{thai,russian,vietnamese,hindi,french,indonesian,german,arabic,portuguese}-support.mjs`
- Modify: `scripts/generate-address-gap-language-support.mjs`
- Modify: `scripts/generate-next-address-gap-language-support.mjs`
- Create: language-specific modules under `scripts/data/`

- [x] Split word waves, transliteration tables, label rules, and suffix inventories by semantic group.
- [x] Keep each entry point focused on validation, normalization, and output orchestration.
- [x] Verify each generator parses and its focused tests pass.

### Task 4: Decompose policy audit and operational scripts

**Files:**

- Modify: `scripts/codebook-policy-audit.mjs`
- Modify: `scripts/production-smoke.mjs`
- Modify: `scripts/apply-language-expansion-batch.mjs`
- Modify: `packages/ground-codes/scripts/explore-lattice-count-research.ts`
- Create: focused policy, smoke-check, batch, and research modules

- [x] Separate policy configuration from evaluators and report formatting.
- [x] Group smoke checks by API, language, planetary, and web concerns.
- [x] Update batch source-registration paths to the decomposed runtime layout.
- [x] Split research math, shell, factorization, and benchmark orchestration.

### Task 5: Decompose oversized tests

**Files:**

- Split: `packages/ground-codes/test/multilingual-codebook-review.test.ts`
- Split: `apps/api-ground-codes/src/app.test.ts`
- Split: `scripts/codebook-policy-audit.test.mjs`
- Split: `scripts/address-gap-codebook-quality.test.mjs`
- Split: `scripts/language-support-completeness.test.mjs`
- Split: `packages/ground-codes/test/celestial-body.test.ts`

- [x] Extract shared fixtures and assertions.
- [x] Divide suites by capability or language family, preserving every test case.
- [x] Run each affected package or script test suite.

### Task 6: Verify the repository-wide boundary

**Files:**

- Modify: `scripts/code-size-policy.test.mjs`
- Modify: this plan

- [x] Run `pnpm code:size-check` and verify zero maintained-source violations.
- [x] Run workspace format, lint, type-check, unit tests, and production builds.
- [x] Confirm generated outputs have no unintended diff.
- [x] Mark this plan complete and commit the final decomposition.
