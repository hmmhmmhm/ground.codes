import { performance } from "node:perf_hooks";

import { getCoordinates, getNFromCoordinates } from "../src/spiral.js";

type Point = { x: number; y: number };
type Shell = {
  points: [number, number][];
  indexByCoordinate: Map<string, number>;
};
type SpiralIndex = {
  maxM: number;
  shellMs: Uint32Array;
  cumulativeCounts: Uint32Array;
  shells: Map<number, Shell>;
};

const MAX_N = Number(process.env.MAX_N ?? 100_000_000);
const CASES = Number(process.env.CASES ?? 100_000);
const SEED = Number(process.env.SEED ?? 0x51a7e11);
const INCLUDE_SHELL_CACHE = process.env.INCLUDE_SHELL_CACHE !== "0";

function createRandom(seedInput: number) {
  let seed = seedInput;
  return {
    int(min: number, max: number) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return min + Math.floor((seed / 0x100000000) * (max - min + 1));
    },
  };
}

const rng = createRandom(SEED);
const randomNs = Array.from({ length: CASES }, () => rng.int(1, MAX_N));

function buildIndex(maxN: number): SpiralIndex {
  const maxM = findMaxM(maxN);
  const shellMs: number[] = [];
  const cumulativeCounts: number[] = [];
  const shells = new Map<number, Shell>();
  let cumulative = 0;

  for (let m = 0; m <= maxM; m++) {
    const points = getSymmetricPoints(m);
    if (points.length === 0) continue;

    points.sort(compareByAngleDescending);
    cumulative += points.length;
    shellMs.push(m);
    cumulativeCounts.push(cumulative);

    if (INCLUDE_SHELL_CACHE) {
      const indexByCoordinate = new Map<string, number>();
      points.forEach(([x, y], index) => {
        indexByCoordinate.set(`${x},${y}`, index + 1);
      });
      shells.set(m, { points, indexByCoordinate });
    }
  }

  return {
    maxM,
    shellMs: Uint32Array.from(shellMs),
    cumulativeCounts: Uint32Array.from(cumulativeCounts),
    shells,
  };
}

function findMaxM(maxN: number): number {
  const approxM = Math.floor(maxN / Math.PI);
  let high = approxM + Math.ceil(Math.sqrt(maxN));

  while (countLatticePoints(high) < maxN) high *= 2;

  let low = 0;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (countLatticePoints(mid) < maxN) low = mid + 1;
    else high = mid;
  }

  return low;
}

function getCoordinatesFromIndex(index: SpiralIndex, n: number): Point {
  if (n <= 0) throw new Error("Invalid value for n.");

  const shellIndex = lowerBound(index.cumulativeCounts, n);
  const m = index.shellMs[shellIndex]!;
  const previousCount =
    shellIndex === 0 ? 0 : index.cumulativeCounts[shellIndex - 1]!;
  const k = n - previousCount;
  const shell = getIndexedShell(index, m);
  const [x, y] = shell.points[k - 1]!;

  return { x, y };
}

function getNFromCoordinatesFromIndex(
  index: SpiralIndex,
  x: number,
  y: number
): number {
  const m = x * x + y * y;
  const shellIndex = binarySearchExact(index.shellMs, m);
  if (shellIndex < 0) throw new Error("Invalid coordinates.");

  const previousCount =
    shellIndex === 0 ? 0 : index.cumulativeCounts[shellIndex - 1]!;
  const shell = getIndexedShell(index, m);
  const k = shell.indexByCoordinate.get(`${x},${y}`);
  if (k === undefined) throw new Error("Invalid coordinates.");

  return previousCount + k;
}

function getIndexedShell(index: SpiralIndex, m: number): Shell {
  const cached = index.shells.get(m);
  if (cached) return cached;

  const points = getSymmetricPoints(m);
  points.sort(compareByAngleDescending);
  const indexByCoordinate = new Map<string, number>();
  points.forEach(([x, y], pointIndex) => {
    indexByCoordinate.set(`${x},${y}`, pointIndex + 1);
  });

  const shell = { points, indexByCoordinate };
  index.shells.set(m, shell);
  return shell;
}

function lowerBound(values: Uint32Array, target: number): number {
  let low = 0;
  let high = values.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    if (values[mid]! < target) low = mid + 1;
    else high = mid;
  }

  return low;
}

function binarySearchExact(values: Uint32Array, target: number): number {
  let low = 0;
  let high = values.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const value = values[mid]!;
    if (value === target) return mid;
    if (value < target) low = mid + 1;
    else high = mid - 1;
  }

  return -1;
}

function countLatticePoints(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;

  const r = Math.floor(Math.sqrt(m));
  let interior = 0;

  for (let x = 1; x <= r; x++) {
    interior += Math.floor(Math.sqrt(m - x * x));
  }

  return 4 * (interior + r) + 1;
}

function getSymmetricPoints(m: number): [number, number][] {
  const points: [number, number][] = [];
  const limit = Math.floor(Math.sqrt(m / 2));

  for (let x = 0; x <= limit; x++) {
    const ySquared = m - x * x;
    const y = Math.floor(Math.sqrt(ySquared));
    if (y < x) continue;
    if (y * y === ySquared) addSymmetricPoints(points, x, y);
  }

  return points;
}

function addSymmetricPoints(points: [number, number][], x: number, y: number) {
  if (x === 0 && y === 0) {
    points.push([0, 0]);
  } else if (x === 0) {
    points.push([0, y], [0, -y], [y, 0], [-y, 0]);
  } else if (x === y) {
    points.push([x, y], [x, -y], [-x, y], [-x, -y]);
  } else {
    points.push(
      [x, y],
      [x, -y],
      [-x, y],
      [-x, -y],
      [y, x],
      [y, -x],
      [-y, x],
      [-y, -x]
    );
  }
}

function angleHalf([, y]: [number, number]): 0 | 1 {
  return y >= 0 ? 0 : 1;
}

function compareByAngleDescending(
  a: [number, number],
  b: [number, number]
): number {
  const halfA = angleHalf(a);
  const halfB = angleHalf(b);
  if (halfA !== halfB) return halfA - halfB;
  if (a[1] === 0 && b[1] === 0) return a[0] - b[0];

  const cross = a[0] * b[1] - a[1] * b[0];
  if (cross !== 0) return cross < 0 ? -1 : 1;
  return 0;
}

function measure<T>(label: string, callback: () => T): T {
  const startedAt = performance.now();
  const result = callback();
  console.log(`${label}: ${(performance.now() - startedAt).toFixed(2)}ms`);
  return result;
}

function assertSame(index: SpiralIndex) {
  for (const n of randomNs) {
    const expected = getCoordinates(n);
    const actual = getCoordinatesFromIndex(index, n);
    if (expected.x !== actual.x || expected.y !== actual.y) {
      throw new Error(
        `n->xy mismatch n=${n}: expected ${expected.x},${expected.y}, actual ${actual.x},${actual.y}`
      );
    }

    const expectedN = getNFromCoordinates(expected.x, expected.y);
    const actualN = getNFromCoordinatesFromIndex(index, expected.x, expected.y);
    if (expectedN !== actualN) {
      throw new Error(
        `xy->n mismatch xy=${expected.x},${expected.y}: expected ${expectedN}, actual ${actualN}`
      );
    }
  }
}

function benchmark(label: string, callback: () => void) {
  const startedAt = performance.now();
  callback();
  console.log(`${label}: ${(performance.now() - startedAt).toFixed(2)}ms`);
}

console.log(
  `seed=${SEED} maxN=${MAX_N} cases=${CASES} includeShellCache=${INCLUDE_SHELL_CACHE}`
);

const index = measure("build representable-shell index", () => buildIndex(MAX_N));
const byteEstimate =
  index.shellMs.byteLength + index.cumulativeCounts.byteLength;
console.log(
  `maxM=${index.maxM} shells=${index.shellMs.length} typedArrayBytes=${byteEstimate} shellCacheSize=${index.shells.size}`
);

measure("compatibility", () => assertSame(index));

const coordinateInputs = randomNs.map((n) => getCoordinates(n));

benchmark("current getCoordinates random n", () => {
  for (const n of randomNs) getCoordinates(n);
});

benchmark("indexed getCoordinates random n", () => {
  for (const n of randomNs) getCoordinatesFromIndex(index, n);
});

benchmark("current getNFromCoordinates random xy", () => {
  for (const { x, y } of coordinateInputs) getNFromCoordinates(x, y);
});

benchmark("indexed getNFromCoordinates random xy", () => {
  for (const { x, y } of coordinateInputs) {
    getNFromCoordinatesFromIndex(index, x, y);
  }
});
