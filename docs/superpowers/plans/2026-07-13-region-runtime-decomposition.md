# Region Runtime Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3,823-line region monolith with focused modules under 450 lines while preserving all Earth, Moon, Mars, language, fallback, and store behavior.

**Architecture:** Region types and configured-store state become dependency-light modules. A dataset resolver derives the existing geoint filename convention from body, level, and language instead of enumerating hundreds of identical loader closures. Data caching/loading, geometric selection, and public query orchestration are isolated so each module has one responsibility and no circular runtime dependency.

**Tech Stack:** TypeScript ESM, Node `createRequire`, tsup, tsx tests, Node source-size policy.

---

### Task 1: Specify the dataset convention and source boundary

**Files:**

- Modify: `scripts/code-size-policy.test.mjs`
- Create: `packages/ground-codes/test/region-dataset-resolver.test.ts`

- [ ] Add `packages/ground-codes/src/region.ts` to the maintained runtime boundary and verify the policy test fails at 3,823 lines.
- [ ] Write resolver tests for `region-1`, localized Earth levels 2/3, Moon level 2, Mars levels 2/3, invalid Moon/Mars levels, and an unsupported language.
- [ ] Run the resolver test and verify RED because `region-dataset.ts` does not exist.
- [ ] Commit with `test(core): define region module boundaries`.

### Task 2: Extract types, store state, and language sets

**Files:**

- Create: `packages/ground-codes/src/region-types.ts`
- Create: `packages/ground-codes/src/region-store.ts`
- Create: `packages/ground-codes/src/region-languages.ts`
- Modify: `packages/ground-codes/src/region.ts`

- [ ] Move the `Region`, `RegionSearchResult`, and `RegionStore` interfaces unchanged and re-export them from `region.ts`.
- [ ] Move `configuredRegionStore`, `setRegionStore`, and `getRegionStore` unchanged and re-export them from `region.ts`.
- [ ] Move `regionSupportedLanguages`, `addressGapLanguages`, and `englishRegionFallbackLanguages` unchanged and export them only to the data module.
- [ ] Run `pnpm check-types` and verify the workspace gate passes.

### Task 3: Implement convention-based dataset loading

**Files:**

- Create: `packages/ground-codes/src/region-dataset.ts`
- Modify: `packages/ground-codes/src/region.ts`

- [ ] Implement `getRegionDatasetName({ body, regionLevel, language })` with these exact rules: Earth level 1 is `region-1`; Earth levels 2/3 are `region-{level}{-language}`; Moon accepts only level 2 and is `region-2-moon{-language}`; Mars accepts levels 2/3 and is `region-{level}-mars{-language}`; English has an empty suffix; unsupported languages and levels throw the existing error messages.
- [ ] Move `createRequire`, region-data cache, `loadRegionData`, `loadRegions`, lookup-row caching, and lookup normalization into `region-dataset.ts`; remove `addressGapRegionLoaders` and all repeated body/language branches.
- [ ] Run the resolver test and verify GREEN, then run package build and workspace type checks.

### Task 4: Extract geometric selection and public orchestration

**Files:**

- Create: `packages/ground-codes/src/region-geometry.ts`
- Modify: `packages/ground-codes/src/region.ts`

- [ ] Move distance conversion, Haversine calculation, closest/prominent selection, and region-result mapping to `region-geometry.ts`; re-export `calculateDistance` and `toRadians` from `region.ts`.
- [ ] Keep only `findClosestRegion`, `findRegionByCodeOrName`, and `findRegionsByQuery` orchestration in `region.ts`, importing data, store, and geometry helpers.
- [ ] Add every new region source file to the boundary assertion and verify GREEN.
- [ ] Run region-store tests, package build, full workspace format/lint/type gates, mark this plan complete, and commit with `refactor(core): decompose region runtime`.
