import { performance } from "node:perf_hooks";

type Point = { x: number; y: number };
type PointTuple = [number, number];
type Candidate = {
  name: string;
  getCoordinates: (n: number) => Point;
  getNFromCoordinates: (x: number, y: number) => number;
};

const MAX_N = Number(process.env.MAX_N ?? 100_000_000);
const CASES = Number(process.env.CASES ?? 10_000);
const seedStart = Number(process.env.SEED ?? 0x5eed1234);

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
const randomNs = Array.from({ length: CASES }, () => rng.int(1, MAX_N));

function countLatticePoints(m: number): number {
  if (m < 0) return 0;
  const r = Math.floor(Math.sqrt(m));
  let count = 0;
  for (let x = 0; x <= r; x++) {
    const temp = m - x * x;
    if (temp < 0) continue;
    const k = Math.floor(Math.sqrt(temp));
    count += (x === 0 ? 1 : 2) * (2 * k + 1);
  }
  return count;
}

function getPointsByScan(m: number): PointTuple[] {
  const points: PointTuple[] = [];
  const r = Math.floor(Math.sqrt(m));
  for (let x = -r; x <= r; x++) {
    const temp = m - x * x;
    if (temp < 0) continue;
    const k = Math.floor(Math.sqrt(temp));
    if (k * k === temp) {
      if (k > 0) {
        points.push([x, k]);
        points.push([x, -k]);
      } else {
        points.push([x, 0]);
      }
    }
  }
  return points;
}

function getPointsByFactorization(m: number): PointTuple[] {
  const points: PointTuple[] = [];
  const limit = Math.floor(Math.sqrt(m / 2));

  for (let x = 0; x <= limit; x++) {
    const ySquared = m - x * x;
    const y = Math.floor(Math.sqrt(ySquared));
    if (y < x) continue;
    if (y * y !== ySquared) continue;

    addSymmetricPoints(points, x, y);
  }

  return points;
}

function addSymmetricPoints(points: PointTuple[], x: number, y: number) {
  const seen = new Set<string>();
  const candidates: PointTuple[] = [
    [x, y],
    [x, -y],
    [-x, y],
    [-x, -y],
    [y, x],
    [y, -x],
    [-y, x],
    [-y, -x],
  ];

  for (const [px, py] of candidates) {
    const key = `${px},${py}`;
    if (seen.has(key)) continue;
    seen.add(key);
    points.push([px, py]);
  }
}

function compareByAtan2Desc(a: PointTuple, b: PointTuple) {
  return Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0]);
}

function angleHalf([, y]: PointTuple): 0 | 1 {
  return y >= 0 ? 0 : 1;
}

function compareByIntegerAngleDesc(a: PointTuple, b: PointTuple) {
  const halfA = angleHalf(a);
  const halfB = angleHalf(b);
  if (halfA !== halfB) return halfA - halfB;
  if (a[1] === 0 && b[1] === 0) return a[0] - b[0];

  const cross = a[0] * b[1] - a[1] * b[0];
  if (cross !== 0) return cross < 0 ? -1 : 1;
  return 0;
}

function isAngleGreaterByInteger(px: number, py: number, x: number, y: number) {
  return compareByIntegerAngleDesc([px, py], [x, y]) < 0;
}

function getMAndK(n: number) {
  const approxM = Math.floor(n / Math.PI);
  const delta = Math.ceil(Math.sqrt(n));
  let low = Math.max(0, approxM - delta);
  let high = approxM + delta;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (countLatticePoints(mid) < n) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  const m = low;
  const sMMinus1 = m > 0 ? countLatticePoints(m - 1) : 0;
  return { m, k: n - sMMinus1 };
}

const original: Candidate = {
  name: "original atan2 + scan",
  getCoordinates(n) {
    if (n <= 0) throw new Error("Invalid value for n.");
    if (n === 1) return { x: 0, y: 0 };
    const { m, k } = getMAndK(n);
    const points = getPointsByScan(m);
    points.sort(compareByAtan2Desc);
    const [x, y] = points[k - 1]!;
    return { x, y };
  },
  getNFromCoordinates(x, y) {
    if (x === 0 && y === 0) return 1;
    const m = x * x + y * y;
    const sMMinus1 = m > 0 ? countLatticePoints(m - 1) : 0;
    const points = getPointsByScan(m);
    let count = 0;
    for (const [px, py] of points) {
      if (Math.atan2(py, px) > Math.atan2(y, x)) count++;
    }
    return sMMinus1 + count + 1;
  },
};

const integerAngleScan: Candidate = {
  name: "integer angle + scan",
  getCoordinates(n) {
    if (n <= 0) throw new Error("Invalid value for n.");
    if (n === 1) return { x: 0, y: 0 };
    const { m, k } = getMAndK(n);
    const points = getPointsByScan(m);
    points.sort(compareByIntegerAngleDesc);
    const [x, y] = points[k - 1]!;
    return { x, y };
  },
  getNFromCoordinates(x, y) {
    if (x === 0 && y === 0) return 1;
    const m = x * x + y * y;
    const sMMinus1 = m > 0 ? countLatticePoints(m - 1) : 0;
    const points = getPointsByScan(m);
    let count = 0;
    for (const [px, py] of points) {
      if (isAngleGreaterByInteger(px, py, x, y)) count++;
    }
    return sMMinus1 + count + 1;
  },
};

const factorizedShell: Candidate = {
  name: "integer angle + factorized shell",
  getCoordinates(n) {
    if (n <= 0) throw new Error("Invalid value for n.");
    if (n === 1) return { x: 0, y: 0 };
    const { m, k } = getMAndK(n);
    const points = getPointsByFactorization(m);
    points.sort(compareByIntegerAngleDesc);
    const [x, y] = points[k - 1]!;
    return { x, y };
  },
  getNFromCoordinates(x, y) {
    if (x === 0 && y === 0) return 1;
    const m = x * x + y * y;
    const sMMinus1 = m > 0 ? countLatticePoints(m - 1) : 0;
    const points = getPointsByFactorization(m);
    let count = 0;
    for (const [px, py] of points) {
      if (isAngleGreaterByInteger(px, py, x, y)) count++;
    }
    return sMMinus1 + count + 1;
  },
};

const candidates = [integerAngleScan, factorizedShell];

function compareOutputs(candidate: Candidate) {
  for (let i = 0; i < randomNs.length; i++) {
    const n = randomNs[i]!;
    const expected = original.getCoordinates(n);
    const actual = candidate.getCoordinates(n);
    if (expected.x !== actual.x || expected.y !== actual.y) {
      throw new Error(
        `${candidate.name} n->xy mismatch at i=${i}, n=${n}: expected ${expected.x},${expected.y}, actual ${actual.x},${actual.y}`
      );
    }

    const expectedN = original.getNFromCoordinates(expected.x, expected.y);
    const actualN = candidate.getNFromCoordinates(expected.x, expected.y);
    if (expectedN !== actualN) {
      throw new Error(
        `${candidate.name} xy->n mismatch at i=${i}, xy=${expected.x},${expected.y}: expected ${expectedN}, actual ${actualN}`
      );
    }
  }
}

function measure(label: string, callback: () => void) {
  const startedAt = performance.now();
  callback();
  const elapsed = performance.now() - startedAt;
  console.log(`${label}: ${elapsed.toFixed(2)}ms`);
}

console.log(`seed=${seedStart} maxN=${MAX_N} cases=${CASES}`);

for (const candidate of candidates) {
  measure(`${candidate.name} compatibility`, () => compareOutputs(candidate));
}

const coordinateInputs = randomNs.map((n) => original.getCoordinates(n));
const benchmarkCandidates = [original, ...candidates];

for (const candidate of benchmarkCandidates) {
  measure(`${candidate.name} n->xy`, () => {
    for (const n of randomNs) candidate.getCoordinates(n);
  });
  measure(`${candidate.name} xy->n`, () => {
    for (const { x, y } of coordinateInputs) candidate.getNFromCoordinates(x, y);
  });
}
