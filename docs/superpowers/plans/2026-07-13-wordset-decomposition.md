# Wordset Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the canonical wordset runtime below 450 lines per file while preserving all 180 static codebook imports and public types.

**Architecture:** Language metadata moves to a focused module. The static dynamic-import chain is split into two loader ranges so tsup can continue discovering every codebook chunk. `wordset.ts` remains the public encode/decode façade and dispatches across the two loader ranges.

**Tech Stack:** TypeScript, tsup, tsx test runner, Node source-size policy.

---

### Task 1: Add the wordset source boundary

**Files:**

- Modify: `scripts/code-size-policy.test.mjs`

- [ ] Add `packages/ground-codes/src/wordset.ts` to the maintained runtime path assertion.
- [ ] Run `node --test scripts/code-size-policy.test.mjs` and verify RED reports 1,148 lines.
- [ ] Commit with `test: define wordset source boundary`.

### Task 2: Extract language metadata

**Files:**

- Create: `packages/ground-codes/src/wordset-language.ts`
- Modify: `packages/ground-codes/src/wordset.ts`

- [ ] Move `SupportedLanguage` and `wordSetBaseCount` unchanged to `wordset-language.ts`.
- [ ] Re-export both from `wordset.ts` and import them for its internal signatures.
- [ ] Run `pnpm --filter ground-codes check-types` and verify it passes.

### Task 3: Split static codebook loaders

**Files:**

- Create: `packages/ground-codes/src/wordset-loader-primary.ts`
- Create: `packages/ground-codes/src/wordset-loader-secondary.ts`
- Modify: `packages/ground-codes/src/wordset.ts`

- [ ] Move the `english` through `avaric` static import branches into `loadPrimaryWordSet(language): Promise<string[] | null>` and return `null` after the chain.
- [ ] Move the `avestan` through `tatar` branches into `loadSecondaryWordSet(language): Promise<string[] | null>` and return `null` after the chain.
- [ ] Implement the façade loader as `const wordSet = (await loadPrimaryWordSet(language)) ?? (await loadSecondaryWordSet(language));` and preserve the existing invalid-language error when both return null.
- [ ] Add all four wordset source files to the boundary assertion, then run it and verify GREEN.
- [ ] Run the candidate, Japanese, expansion-batch, and major-European wordset tests, followed by package type-check and build.
- [ ] Run repository format, lint, and type gates; mark this plan complete and commit with `refactor(core): split wordset registry`.
