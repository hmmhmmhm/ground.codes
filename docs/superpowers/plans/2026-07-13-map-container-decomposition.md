# Map Container Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the 1,146-line map container hook and every extracted module below 450 lines while preserving its public return contract and map behavior.

**Architecture:** Initial URL/cookie interpretation becomes a pure module. Search owns its transient result/marker/info-window state in a dedicated hook. Camera/fullscreen controls and map lifecycle callbacks become focused hooks, while body/map presentation effects move to a presentation hook. `useMapContainer` remains the state-composition façade.

**Tech Stack:** React hooks, TypeScript, Google Maps API, Next.js, Bun tests, source-size policy.

---

### Task 1: Define the hook source boundary

**Files:**

- Modify: `scripts/code-size-policy.test.mjs`

- [ ] Add `apps/web/components/google-map/hooks/use-map-container.ts` to the runtime boundary assertion.
- [ ] Run the policy test and verify RED reports 1,146 lines.
- [ ] Commit with `test(web): define map hook source boundary`.

### Task 2: Extract initial-state helpers

**Files:**

- Create: `apps/web/components/google-map/hooks/map-container-initial-state.ts`
- Modify: `apps/web/components/google-map/hooks/use-map-container.ts`

- [ ] Move `EarthMapType`, library configuration, and all URL/cookie/default initializers above `useMapContainer` to the pure module.
- [ ] Import the initializers and re-export `EarthMapType` from the façade.

### Task 3: Extract search state and actions

**Files:**

- Create: `apps/web/components/google-map/hooks/use-map-search.ts`
- Modify: `apps/web/components/google-map/hooks/use-map-container.ts`

- [ ] Move place selection, ground-code search/suggest, result application, share-path restoration, marker/info-window ownership, and cleanup into `useMapSearch`.
- [ ] Return all existing search-facing values plus `cleanupSearch`, keeping the façade return keys unchanged.

### Task 4: Extract controls, presentation, and lifecycle

**Files:**

- Create: `apps/web/components/google-map/hooks/use-map-controls.ts`
- Create: `apps/web/components/google-map/hooks/use-map-presentation.ts`
- Create: `apps/web/components/google-map/hooks/use-map-lifecycle.ts`
- Modify: `apps/web/components/google-map/hooks/use-map-container.ts`

- [ ] Move heading, tilt, map-type selection, and fullscreen state/actions to `useMapControls`.
- [ ] Move body/map-type rendering and URL synchronization effects to `useMapPresentation`.
- [ ] Move load, unmount, zoom, and Google-map listener setup to `useMapLifecycle`.
- [ ] Compose the hooks in `useMapContainer` and preserve every returned property.

### Task 5: Verify the decomposition

**Files:**

- Modify: `scripts/code-size-policy.test.mjs`

- [ ] Add all six map-container modules to the runtime boundary assertion and verify GREEN.
- [ ] Run web type-check, lint, 62-unit-test suite, and production build.
- [ ] Run workspace format/lint/type gates, mark this plan complete, and commit with `refactor(web): decompose map container hook`.
