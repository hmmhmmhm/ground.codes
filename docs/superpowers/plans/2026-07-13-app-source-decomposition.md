# App Source Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplicated spiral code and bring the first app-facing runtime modules under the repository's 450-line limit without changing behavior.

**Architecture:** The Grok app consumes the canonical `ground-codes` spiral API instead of maintaining a byte-for-byte copy. Earth and planetary map files retain React lifecycle ownership while pure map/grid/Cesium helpers move into adjacent focused modules. PostGIS query selection helpers move out of the store class so database lifecycle and SQL execution remain in the store file.

**Tech Stack:** TypeScript, React, Next.js, Cesium, PostgreSQL client interfaces, Node test runner, pnpm/Turborepo.

---

### Task 1: Define the app source-boundary contract

**Files:**

- Modify: `scripts/code-size-policy.test.mjs`

- [x] **Step 1: Add a failing test for the targeted runtime modules**

Add a filesystem-backed test that evaluates these maintained files with the existing policy:

```js
import { readFileSync } from "node:fs";

test("keeps app runtime modules within the maintained-source limit", () => {
  const paths = [
    "apps/grok-spiral/lib/grok-spiral.ts",
    "apps/web/components/google-map/earth-3d-map.tsx",
    "apps/web/components/google-map/planetary-3d-map.tsx",
    "apps/api-ground-codes/src/postgis-region-store.ts",
  ];

  assert.deepEqual(
    paths.flatMap((path) => {
      const violation = evaluateSourceFile({
        path,
        source: readFileSync(path, "utf8"),
      });
      return violation ? [violation] : [];
    }),
    [],
  );
});
```

- [x] **Step 2: Run the test and verify RED**

Run: `node --test scripts/code-size-policy.test.mjs`

Expected: FAIL and list all four oversized maintained files.

- [x] **Step 3: Commit the contract**

```bash
git add scripts/code-size-policy.test.mjs
git commit -m "test: define app source boundaries"
```

### Task 2: Replace the Grok spiral copy with the workspace package

**Files:**

- Modify: `apps/grok-spiral/package.json`
- Modify: `apps/grok-spiral/lib/grok-spiral.ts`
- Modify: `pnpm-lock.yaml`

- [x] **Step 1: Add the canonical package dependency**

Add `"ground-codes": "workspace:*"` to the Grok app dependencies and run `pnpm install --lockfile-only`.

- [x] **Step 2: Replace the duplicate implementation with re-exports**

Replace the entire local implementation with the browser-safe canonical source
module. The package root also imports Node-only region loading, so the Grok app
must use the focused spiral module:

```ts
export {
  getCoordinates,
  getNFromCoordinates,
} from "ground-codes/src/spiral";
```

- [x] **Step 3: Verify the focused boundary and app checks**

Run:

```bash
node --test scripts/code-size-policy.test.mjs
pnpm --filter grok-spiral check-types
pnpm --filter grok-spiral lint
pnpm --filter grok-spiral build
```

Expected: the boundary test still fails for Earth, planetary, and PostGIS only; Grok type-check, lint, and build pass.

- [x] **Step 4: Commit the deduplication**

```bash
git add apps/grok-spiral/package.json apps/grok-spiral/lib/grok-spiral.ts pnpm-lock.yaml
git commit -m "refactor(grok): reuse canonical spiral implementation"
```

### Task 3: Extract Earth 3D grid helpers

**Files:**

- Create: `apps/web/components/google-map/earth-3d-grid.ts`
- Modify: `apps/web/components/google-map/earth-3d-map.tsx`

- [x] **Step 1: Move pure grid types and functions**

Move `Map3DElementInstance`, `GRID_ALTITUDE_METERS`, the grid color constants, `GridViewport`, and the grid functions into `earth-3d-grid.ts`. Export the shared camera type, initial range, grid viewport/signature functions, and append function:

```ts
export type Map3DElementInstance = HTMLElement & {
  center?: { lat: number; lng: number; altitude?: number };
  flyCameraTo?: (options: Record<string, unknown>) => void;
  heading?: number;
  range?: number;
  tilt?: number;
};

export const INITIAL_CAMERA_RANGE_METERS = 32000000;
export const getGridViewport: (map3d: Map3DElementInstance) => GridViewport;
export const getGridSignature: (viewport: GridViewport) => string;
export const appendGrid: (map3d: Map3DElementInstance) => HTMLElement[];
```

Keep marker-label and heading helpers in the component because they are UI/camera behavior, then import `appendEarthGrid` and `EarthMap3DElement` from the new module.

- [x] **Step 2: Verify web behavior and the boundary test**

Run:

```bash
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web test
node --test scripts/code-size-policy.test.mjs
```

Expected: web checks pass; the boundary test now fails for planetary and PostGIS only.

- [x] **Step 3: Commit the Earth split**

```bash
git add apps/web/components/google-map/earth-3d-grid.ts apps/web/components/google-map/earth-3d-map.tsx
git commit -m "refactor(web): extract Earth grid helpers"
```

### Task 4: Extract planetary Cesium helpers

**Files:**

- Create: `apps/web/components/google-map/planetary-cesium.ts`
- Create: `apps/web/components/google-map/planetary-grid.ts`
- Modify: `apps/web/components/google-map/planetary-3d-map.tsx`

- [ ] **Step 1: Move Cesium loading and camera helpers**

Move Cesium URL constants, module/viewer types, `getErrorMessage`, heading-delta helpers, `loadCesium`, `getAssetId`, `getEllipsoid`, and `getScreenNorthHeading` to `planetary-cesium.ts`. Export the types and functions used by the component.

- [ ] **Step 2: Move grid and label helpers**

Move grid constants and functions from `getGridStepDegrees` through `getGridBounds`, plus `createLandmarkLabels`, to `planetary-grid.ts`. Export:

```ts
export { createLandmarkLabels, getGridBounds, getGridStepDegrees };
```

Import the required Cesium types from `planetary-cesium.ts` and retain the existing calculations unchanged.

- [ ] **Step 3: Verify web behavior and the boundary test**

Run:

```bash
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web test
node --test scripts/code-size-policy.test.mjs
```

Expected: web checks pass; the boundary test now fails for PostGIS only.

- [ ] **Step 4: Commit the planetary split**

```bash
git add apps/web/components/google-map/planetary-cesium.ts apps/web/components/google-map/planetary-grid.ts apps/web/components/google-map/planetary-3d-map.tsx
git commit -m "refactor(web): extract planetary map helpers"
```

### Task 5: Extract PostGIS selection helpers

**Files:**

- Create: `apps/api-ground-codes/src/postgis-region-selection.ts`
- Modify: `apps/api-ground-codes/src/postgis-region-store.ts`

- [ ] **Step 1: Move row mapping and prominent-region selection**

Move `RegionRow`, lookup normalization, row mapping, distance calculation, prominent-region selection, fallback-level selection, and dataset-name resolution to `postgis-region-selection.ts`. Export the focused contract:

```ts
export type RegionRow = {
  source_index: number;
  name: string;
  code: string;
  lat: number | string;
  lng: number | string;
  body: CelestialBody;
  region_level: number;
  population: number | string | null;
  country_code?: string | null;
  distance_km?: number | string | null;
};
export const normalizeLookupKey: (value: string) => string;
export const toRegionSearchResult: (row: RegionRow) => RegionSearchResult;
export const selectProminentRegionRow: (
  rows: RegionRow[],
  target: { lat: number; lng: number },
  body: CelestialBody,
) => { row: RegionRow; distanceKm: number } | null;
export const getFallbackSearchLevels: (
  body: CelestialBody,
  regionLevel: number,
) => number[];
export const getDatasetName: (
  body: CelestialBody,
  regionLevel: number,
  language: SupportedLanguage | "english",
) => string;
```

Import these helpers into the store and leave SQL/database lifecycle unchanged.

- [ ] **Step 2: Verify API behavior and the boundary contract**

Run:

```bash
pnpm --filter ground-codes-api test
pnpm --filter ground-codes-api check-types
pnpm --filter ground-codes-api lint
node --test scripts/code-size-policy.test.mjs
```

Expected: API checks pass and the boundary test passes.

- [ ] **Step 3: Run the slice-wide quality checks**

Run:

```bash
pnpm format:check
pnpm lint
pnpm check-types
```

Expected: all commands pass.

- [ ] **Step 4: Commit the PostGIS split and close the plan**

Mark all plan checkboxes complete, then commit:

```bash
git add apps/api-ground-codes/src/postgis-region-selection.ts apps/api-ground-codes/src/postgis-region-store.ts scripts/code-size-policy.test.mjs docs/superpowers/plans/2026-07-13-app-source-decomposition.md
git commit -m "refactor(api): extract PostGIS selection helpers"
```
