import { performance } from "node:perf_hooks";

import {
  areaApproximationCount,
  boundaryCorrectedApproximationCount,
  boundaryWalkCount,
  convexHullCount,
  convexHullCountFlat,
  convexHullCountFlatTuned,
  firstOctantCount,
  firstQuadrantCount,
  fractionalPartIdentityCount,
  jacobiDivisorSummatoryCount,
  polygonAreaApproximationCount,
  sqrtSumCount,
} from "./lattice-count-candidates.js";
import {
  factorShell,
  gaussianIntegerShell,
  gaussianSmallGateShell,
  scanShell,
  sortedKeys,
  symmetricShell,
} from "./lattice-shell-candidates.js";

type Point = [number, number];
type CountCandidate = {
  name: string;
  count: (m: number) => number;
  exact?: boolean;
};
type ShellCandidate = {
  name: string;
  points: (m: number) => Point[];
};

const MAX_M = Number(process.env.MAX_M ?? 100_000_000);
const MIN_M = Number(process.env.MIN_M ?? 0);
const CASES = Number(process.env.CASES ?? 20_000);
const seedStart = Number(process.env.SEED ?? 0xdecafbad);

function createRandom(seedInput: number) {
  let seed = seedInput;
  return {
    int(min: number, max: number) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return min + Math.floor((seed / 0x100000000) * (max - min + 1));
    },
  };
}

const rng = createRandom(seedStart);
const randomMs = Array.from({ length: CASES }, () => rng.int(MIN_M, MAX_M));
const maxCoordinate = Math.floor(Math.sqrt(MAX_M / 2));
const representableMs = Array.from({ length: CASES }, () => {
  const x = rng.int(0, maxCoordinate);
  const y = rng.int(x, maxCoordinate);
  return Math.max(MIN_M, x * x + y * y);
});

function assertCountCandidate(candidate: CountCandidate) {
  if (candidate.exact === false) {
    let mismatches = 0;
    for (let m = 0; m <= 100_000; m++) {
      if (sqrtSumCount(m) !== candidate.count(m)) mismatches++;
    }
    for (const m of randomMs) {
      if (sqrtSumCount(m) !== candidate.count(m)) mismatches++;
    }
    console.log(`${candidate.name} expected inexact mismatches=${mismatches}`);
    return;
  }

  for (let m = 0; m <= 100_000; m++) {
    const expected = sqrtSumCount(m);
    const actual = candidate.count(m);
    if (expected !== actual) {
      throw new Error(
        `${candidate.name} count mismatch at m=${m}: expected ${expected}, actual ${actual}`,
      );
    }
  }
  for (const m of randomMs) {
    const expected = sqrtSumCount(m);
    const actual = candidate.count(m);
    if (expected !== actual) {
      throw new Error(
        `${candidate.name} count mismatch at m=${m}: expected ${expected}, actual ${actual}`,
      );
    }
  }
}

function assertShellCandidate(candidate: ShellCandidate) {
  for (let m = 0; m <= 100_000; m++) {
    const expected = sortedKeys(scanShell(m));
    const actual = sortedKeys(candidate.points(m));
    if (
      expected.length !== actual.length ||
      expected.some((value, index) => value !== actual[index])
    ) {
      throw new Error(`${candidate.name} shell mismatch at m=${m}`);
    }
  }
  for (const m of randomMs) {
    const expected = sortedKeys(scanShell(m));
    const actual = sortedKeys(candidate.points(m));
    if (
      expected.length !== actual.length ||
      expected.some((value, index) => value !== actual[index])
    ) {
      throw new Error(`${candidate.name} shell mismatch at m=${m}`);
    }
  }
}

function measure(label: string, callback: () => unknown) {
  const startedAt = performance.now();
  const result = callback();
  const elapsed = performance.now() - startedAt;
  console.log(`${label}: ${elapsed.toFixed(2)}ms`);
  return result;
}

console.log(`seed=${seedStart} minM=${MIN_M} maxM=${MAX_M} cases=${CASES}`);

const countCandidates: CountCandidate[] = [
  { name: "first quadrant sqrt sum", count: firstQuadrantCount },
  {
    name: "fractional-part identity sqrt sum",
    count: fractionalPartIdentityCount,
  },
  { name: "Katai-style boundary walk", count: boundaryWalkCount },
  { name: "first octant sqrt sum", count: firstOctantCount },
  { name: "Jacobi divisor summatory", count: jacobiDivisorSummatoryCount },
  { name: "convex hull", count: convexHullCount },
  { name: "convex hull flat/no-div", count: convexHullCountFlat },
  {
    name: "convex hull tuned 0.75cbrt/squared",
    count: (m) => convexHullCountFlatTuned(m, 0.75),
  },
  {
    name: "convex hull tuned 1.25cbrt/squared",
    count: (m) => convexHullCountFlatTuned(m, 1.25),
  },
  {
    name: "convex hull tuned 1.5cbrt/squared",
    count: (m) => convexHullCountFlatTuned(m, 1.5),
  },
  { name: "area approximation", count: areaApproximationCount, exact: false },
  {
    name: "boundary-corrected area approximation",
    count: boundaryCorrectedApproximationCount,
    exact: false,
  },
  {
    name: "Barvinok-style 64-gon area approximation",
    count: polygonAreaApproximationCount,
    exact: false,
  },
];

const shellCandidates: ShellCandidate[] = [
  { name: "symmetric representatives", points: symmetricShell },
  { name: "sum-of-two-squares filter + symmetric reps", points: factorShell },
  { name: "Gaussian integer factor shell", points: gaussianIntegerShell },
  { name: "Gaussian small gate shell", points: gaussianSmallGateShell },
];

for (const candidate of countCandidates) {
  measure(`${candidate.name} compatibility`, () =>
    assertCountCandidate(candidate),
  );
}

for (const candidate of shellCandidates) {
  measure(`${candidate.name} compatibility`, () =>
    assertShellCandidate(candidate),
  );
}

const countBenchmarks: CountCandidate[] = [
  { name: "baseline sqrt sum", count: sqrtSumCount },
  ...countCandidates,
];

for (const candidate of countBenchmarks) {
  measure(`${candidate.name} random counts`, () => {
    let checksum = 0;
    for (const m of randomMs) checksum += candidate.count(m);
    return checksum;
  });
}

const shellBenchmarks: ShellCandidate[] = [
  { name: "baseline full scan shell", points: scanShell },
  ...shellCandidates,
];

for (const candidate of shellBenchmarks) {
  measure(`${candidate.name} random shells`, () => {
    let checksum = 0;
    for (const m of randomMs) checksum += candidate.points(m).length;
    return checksum;
  });
}

for (const candidate of shellBenchmarks) {
  measure(`${candidate.name} representable shells`, () => {
    let checksum = 0;
    for (const m of representableMs) checksum += candidate.points(m).length;
    return checksum;
  });
}
