import { performance } from "node:perf_hooks";

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

function sqrtSumCount(m: number): number {
  if (m < 0) return 0;
  const r = Math.floor(Math.sqrt(m));
  let count = 0;
  for (let x = 0; x <= r; x++) {
    const y = Math.floor(Math.sqrt(m - x * x));
    count += (x === 0 ? 1 : 2) * (2 * y + 1);
  }
  return count;
}

function firstQuadrantCount(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;
  const r = Math.floor(Math.sqrt(m));
  let interior = 0;
  for (let x = 1; x <= r; x++) {
    interior += Math.floor(Math.sqrt(m - x * x));
  }
  return 4 * (interior + r) + 1;
}

function fractionalPartIdentityCount(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;

  const r = Math.floor(Math.sqrt(m));
  let interior = 0;

  for (let x = 1; x <= r; x++) {
    const root = Math.sqrt(m - x * x);
    interior += root - (root % 1);
  }

  return 4 * (interior + r) + 1;
}

function boundaryWalkCount(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;

  const r = Math.floor(Math.sqrt(m));
  let y = r;
  let interior = 0;

  for (let x = 1; x <= r; x++) {
    const xSquared = x * x;
    while (y > 0 && xSquared + y * y > m) y--;
    interior += y;
  }

  return 4 * (interior + r) + 1;
}

function firstOctantCount(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;
  const r = Math.floor(Math.sqrt(m));
  const limit = Math.floor(Math.sqrt(m / 2));
  let diagonalAdjustment = 0;
  let octant = 0;

  for (let x = 1; x <= limit; x++) {
    const y = Math.floor(Math.sqrt(m - x * x));
    octant += y - x + 1;
    if (x * x * 2 <= m) diagonalAdjustment++;
  }

  // First octant points with 1 <= x <= y, mirrored to the quadrant.
  const quadrantInterior = 2 * octant - diagonalAdjustment;
  return 4 * (quadrantInterior + r) + 1;
}

function jacobiDivisorSummatoryCount(m: number): number {
  if (m < 0) return 0;

  let sum = 0;
  for (let left = 1; left <= m; ) {
    const quotient = Math.floor(m / left);
    const right = Math.floor(m / quotient);
    sum += quotient * (chi4Prefix(right) - chi4Prefix(left - 1));
    left = right + 1;
  }

  return 1 + 4 * sum;
}

function chi4Prefix(n: number): number {
  switch (n & 3) {
    case 1:
    case 2:
      return 1;
    default:
      return 0;
  }
}

type Slope = [number, number];

function convexHullCount(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;

  let count = 0;
  const slopeStack: Slope[] = [
    [0, 1],
    [1, 0],
  ];

  const cbrt = Math.floor(Math.cbrt(m));
  const sqrt = Math.floor(Math.sqrt(m));
  const naiveThreshold = Math.min(cbrt + 1, sqrt);

  for (let x = 1; x <= naiveThreshold; x++) {
    count += maxYInCircle(x, m);
  }

  let current: Slope = [naiveThreshold, maxYInCircle(naiveThreshold, m)];

  while (true) {
    let slope = slopeStack.pop()!;

    for (
      let next: Slope;
      pointInCircle((next = goDown(current, slope)), m);
      current = next
    ) {
      count += bottomArea(next, slope);
    }

    if (current[0] >= sqrt - naiveThreshold) break;

    while (
      !pointInCircle(goDown(current, slopeStack[slopeStack.length - 1]!), m)
    ) {
      slope = slopeStack.pop()!;
    }

    while (true) {
      const right = slopeStack[slopeStack.length - 1]!;
      const middle: Slope = [slope[0] + right[0], slope[1] + right[1]];
      const next = goDown(current, middle);

      if (pointInCircle(next, m)) {
        slopeStack.push(middle);
      } else if (slopeOut(right, next[0], m)) {
        slope = middle;
      } else {
        break;
      }
    }
  }

  for (let x = current[0] + 1; x <= sqrt; x++) {
    count += maxYInCircle(x, m);
  }

  return 4 * (count + sqrt) + 1;
}

function convexHullCountFlat(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;

  let count = 0;
  const stackX = [0, 1];
  const stackY = [1, 0];
  let stackLength = 2;

  const cbrt = Math.floor(Math.cbrt(m));
  const sqrt = Math.floor(Math.sqrt(m));
  const naiveThreshold = Math.min(cbrt + 1, sqrt);

  for (let x = 1; x <= naiveThreshold; x++) {
    count += maxYInCircle(x, m);
  }

  let currentX = naiveThreshold;
  let currentY = maxYInCircle(naiveThreshold, m);

  while (true) {
    stackLength--;
    let slopeX = stackX[stackLength]!;
    let slopeY = stackY[stackLength]!;

    while (true) {
      const nextX = currentX + slopeX;
      const nextY = currentY - slopeY;
      if (!pointInCircleXY(nextX, nextY, m)) break;

      count += slopeX * nextY + ((slopeX - 1) * (slopeY - 1)) / 2;
      currentX = nextX;
      currentY = nextY;
    }

    if (currentX >= sqrt - naiveThreshold) break;

    while (
      !pointInCircleXY(
        currentX + stackX[stackLength - 1]!,
        currentY - stackY[stackLength - 1]!,
        m,
      )
    ) {
      stackLength--;
      slopeX = stackX[stackLength]!;
      slopeY = stackY[stackLength]!;
    }

    while (true) {
      const rightX = stackX[stackLength - 1]!;
      const rightY = stackY[stackLength - 1]!;
      const middleX = slopeX + rightX;
      const middleY = slopeY + rightY;
      const nextX = currentX + middleX;
      const nextY = currentY - middleY;

      if (pointInCircleXY(nextX, nextY, m)) {
        stackX[stackLength] = middleX;
        stackY[stackLength] = middleY;
        stackLength++;
      } else if (slopeOutNoDivision(rightX, rightY, nextX, m)) {
        slopeX = middleX;
        slopeY = middleY;
      } else {
        break;
      }
    }
  }

  for (let x = currentX + 1; x <= sqrt; x++) {
    count += maxYInCircle(x, m);
  }

  return 4 * (count + sqrt) + 1;
}

function convexHullCountFlatTuned(m: number, multiplier: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;

  let count = 0;
  const stackX = [0, 1];
  const stackY = [1, 0];
  let stackLength = 2;

  const cbrt = Math.floor(Math.cbrt(m));
  const sqrt = Math.floor(Math.sqrt(m));
  const naiveThreshold = Math.min(
    Math.max(1, Math.floor(cbrt * multiplier)),
    sqrt,
  );

  for (let x = 1; x <= naiveThreshold; x++) {
    count += maxYInCircle(x, m);
  }

  let currentX = naiveThreshold;
  let currentY = maxYInCircle(naiveThreshold, m);

  while (true) {
    stackLength--;
    let slopeX = stackX[stackLength]!;
    let slopeY = stackY[stackLength]!;

    while (true) {
      const nextX = currentX + slopeX;
      const nextY = currentY - slopeY;
      if (!pointInCircleXY(nextX, nextY, m)) break;

      count += slopeX * nextY + ((slopeX - 1) * (slopeY - 1)) / 2;
      currentX = nextX;
      currentY = nextY;
    }

    if (currentX >= sqrt - naiveThreshold) break;

    while (
      !pointInCircleXY(
        currentX + stackX[stackLength - 1]!,
        currentY - stackY[stackLength - 1]!,
        m,
      )
    ) {
      stackLength--;
      slopeX = stackX[stackLength]!;
      slopeY = stackY[stackLength]!;
    }

    while (true) {
      const rightX = stackX[stackLength - 1]!;
      const rightY = stackY[stackLength - 1]!;
      const middleX = slopeX + rightX;
      const middleY = slopeY + rightY;
      const nextX = currentX + middleX;
      const nextY = currentY - middleY;

      if (pointInCircleXY(nextX, nextY, m)) {
        stackX[stackLength] = middleX;
        stackY[stackLength] = middleY;
        stackLength++;
      } else if (slopeOutSquared(rightX, rightY, nextX, m)) {
        slopeX = middleX;
        slopeY = middleY;
      } else {
        break;
      }
    }
  }

  for (let x = currentX + 1; x <= sqrt; x++) {
    count += maxYInCircle(x, m);
  }

  return 4 * (count + sqrt) + 1;
}

function areaApproximationCount(m: number): number {
  return Math.round(Math.PI * m);
}

function boundaryCorrectedApproximationCount(m: number): number {
  return Math.round(Math.PI * m + 2 * Math.sqrt(m));
}

function polygonAreaApproximationCount(m: number): number {
  const sides = 64;
  const areaRatio = (sides * Math.sin((2 * Math.PI) / sides)) / (2 * Math.PI);
  return Math.round(Math.PI * m * areaRatio);
}

function maxYInCircle(x: number, m: number): number {
  return Math.floor(Math.sqrt(m - x * x));
}

function goDown(point: Slope, slope: Slope): Slope {
  return [point[0] + slope[0], point[1] - slope[1]];
}

function bottomArea(point: Slope, slope: Slope): number {
  return slope[0] * point[1] + ((slope[0] - 1) * (slope[1] - 1)) / 2;
}

function pointInCircle(point: Slope, m: number): boolean {
  return point[0] * point[0] + point[1] * point[1] <= m;
}

function slopeOut(slope: Slope, x: number, m: number): boolean {
  return slope[1] / slope[0] > x / Math.sqrt(m - x * x);
}

function pointInCircleXY(x: number, y: number, m: number): boolean {
  return x * x + y * y <= m;
}

function slopeOutNoDivision(
  slopeX: number,
  slopeY: number,
  x: number,
  m: number,
): boolean {
  return slopeY * Math.sqrt(m - x * x) > slopeX * x;
}

function slopeOutSquared(
  slopeX: number,
  slopeY: number,
  x: number,
  m: number,
): boolean {
  return slopeY * slopeY * (m - x * x) > slopeX * slopeX * x * x;
}

function scanShell(m: number): Point[] {
  const points: Point[] = [];
  const r = Math.floor(Math.sqrt(m));
  for (let x = -r; x <= r; x++) {
    const ySquared = m - x * x;
    const y = Math.floor(Math.sqrt(ySquared));
    if (y * y !== ySquared) continue;
    if (y > 0) {
      points.push([x, y], [x, -y]);
    } else {
      points.push([x, 0]);
    }
  }
  return points;
}

function symmetricShell(m: number): Point[] {
  const points: Point[] = [];
  const limit = Math.floor(Math.sqrt(m / 2));
  for (let x = 0; x <= limit; x++) {
    const ySquared = m - x * x;
    const y = Math.floor(Math.sqrt(ySquared));
    if (y < x) continue;
    if (y * y === ySquared) addSymmetricPoints(points, x, y);
  }
  return points;
}

function factorShell(m: number): Point[] {
  // Practical divisor-based shell generation. It uses the sum-of-two-squares
  // theorem only as a filter; actual coordinates are still generated by a
  // bounded representative scan to avoid Gaussian integer reconstruction cost.
  if (!canBeSumOfTwoSquares(m)) return [];
  return symmetricShell(m);
}

type Factor = {
  prime: number;
  exponent: number;
};

function gaussianIntegerShell(m: number): Point[] {
  if (m === 0) return [[0, 0]];

  const factors = factorize(m);
  let scale = 1;
  let reps: Point[] = [[1, 0]];

  for (const { prime, exponent } of factors) {
    if (prime === 2) {
      const factor = gaussianPow([1, 1], exponent);
      reps = reps.map((rep) => gaussianMultiply(rep, factor));
    } else if (prime % 4 === 3) {
      if (exponent % 2 === 1) return [];
      scale *= prime ** (exponent / 2);
    } else {
      const primeRep = findPrimeSumOfSquares(prime);
      const options: Point[] = [];
      for (let k = 0; k <= exponent; k++) {
        options.push(
          gaussianMultiply(
            gaussianPow(primeRep, k),
            gaussianPow([primeRep[0], -primeRep[1]], exponent - k),
          ),
        );
      }

      const nextReps: Point[] = [];
      for (const rep of reps) {
        for (const option of options) {
          nextReps.push(gaussianMultiply(rep, option));
        }
      }
      reps = nextReps;
    }
  }

  const points: Point[] = [];
  const seenRepresentatives = new Set<string>();

  for (const [real, imaginary] of reps) {
    const x = Math.abs(real * scale);
    const y = Math.abs(imaginary * scale);
    const a = Math.min(x, y);
    const b = Math.max(x, y);
    const key = `${a},${b}`;
    if (seenRepresentatives.has(key)) continue;
    seenRepresentatives.add(key);
    addSymmetricPoints(points, a, b);
  }

  return points;
}

function gaussianSmallGateShell(m: number): Point[] {
  return m <= 100_000_000 ? gaussianIntegerShell(m) : symmetricShell(m);
}

function factorize(m: number): Factor[] {
  let n = m;
  const factors: Factor[] = [];

  for (let p = 2; p * p <= n; p += p === 2 ? 1 : 2) {
    if (n % p !== 0) continue;
    let exponent = 0;
    while (n % p === 0) {
      n /= p;
      exponent++;
    }
    factors.push({ prime: p, exponent });
  }

  if (n > 1) factors.push({ prime: n, exponent: 1 });
  return factors;
}

function findPrimeSumOfSquares(prime: number): Point {
  const limit = Math.floor(Math.sqrt(prime));
  for (let x = 1; x <= limit; x++) {
    const ySquared = prime - x * x;
    const y = Math.floor(Math.sqrt(ySquared));
    if (y * y === ySquared) return [x, y];
  }

  throw new Error(`No sum-of-squares representation for prime ${prime}`);
}

function gaussianPow(base: Point, exponent: number): Point {
  let result: Point = [1, 0];
  let power = base;
  let n = exponent;

  while (n > 0) {
    if (n & 1) result = gaussianMultiply(result, power);
    power = gaussianMultiply(power, power);
    n = Math.floor(n / 2);
  }

  return result;
}

function gaussianMultiply(a: Point, b: Point): Point {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}

function canBeSumOfTwoSquares(m: number): boolean {
  let n = m;
  for (let p = 2; p * p <= n; p++) {
    if (n % p !== 0) continue;
    let exponent = 0;
    while (n % p === 0) {
      n /= p;
      exponent++;
    }
    if (p % 4 === 3 && exponent % 2 === 1) return false;
  }
  return n % 4 !== 3;
}

function addSymmetricPoints(points: Point[], x: number, y: number) {
  const seen = new Set<string>();
  const candidates: Point[] = [
    [x, y],
    [x, -y],
    [-x, y],
    [-x, -y],
    [y, x],
    [y, -x],
    [-y, x],
    [-y, -x],
  ];

  for (const point of candidates) {
    const key = `${point[0]},${point[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    points.push(point);
  }
}

function sortedKeys(points: Point[]) {
  return points.map(([x, y]) => `${x},${y}`).sort();
}

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
