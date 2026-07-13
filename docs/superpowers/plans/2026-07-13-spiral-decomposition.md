# Spiral Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 1,481-line spiral implementation into dependency-directed modules under 450 lines without changing number or BigInt coordinates.

**Architecture:** `spiral.ts` remains the public number-path façade. Cache state is centralized, while BigInt coordinate search depends on separate lattice-count and shell modules; both depend on an independent number-theory module. This creates an acyclic graph and preserves cache semantics across all paths.

**Tech Stack:** TypeScript, BigInt, tsx Node tests, tsup, source-size policy.

---

### Task 1: Define the spiral boundary

**Files:**

- Modify: `scripts/code-size-policy.test.mjs`

- [ ] Add `packages/ground-codes/src/spiral.ts` to the runtime boundary assertion.
- [ ] Run the policy test and verify RED reports 1,481 lines.
- [ ] Commit with `test(core): define spiral source boundary`.

### Task 2: Extract cache and number theory

**Files:**

- Create: `packages/ground-codes/src/spiral-cache.ts`
- Create: `packages/ground-codes/src/spiral-bigint-number-theory.ts`
- Modify: `packages/ground-codes/src/spiral.ts`

- [ ] Move number and BigInt shell types, cache maps, enable state, and clear/set/get functions to `spiral-cache.ts`.
- [ ] Move `factorBigInt` through `integerCubeRoot`, including trial primes and root constants, to the number-theory module and export only the functions required by shell/lattice modules.

### Task 3: Extract BigInt lattice, shell, and coordinate search

**Files:**

- Create: `packages/ground-codes/src/spiral-bigint-lattice.ts`
- Create: `packages/ground-codes/src/spiral-bigint-shell.ts`
- Create: `packages/ground-codes/src/spiral-bigint-search.ts`
- Modify: `packages/ground-codes/src/spiral.ts`

- [ ] Move BigInt lattice counting and number-guided convex-hull functions to the lattice module.
- [ ] Move BigInt shell construction, indexing, symmetry, and factorization representation functions to the shell module.
- [ ] Move BigInt N/coordinate conversion, interpolation, secant refinement, and local counting to the search module.
- [ ] Import `getNFromBigIntCoordinates` and `getBigIntCoordinates` into the public façade and preserve overloads unchanged.

### Task 4: Verify the split

**Files:**

- Modify: `scripts/code-size-policy.test.mjs`

- [ ] Add all six spiral source modules to the runtime boundary assertion and verify GREEN.
- [ ] Run spiral fixture, BigInt edge, cache, and package build checks.
- [ ] Run workspace format/lint/type gates, mark this plan complete, and commit with `refactor(core): decompose spiral implementation`.
