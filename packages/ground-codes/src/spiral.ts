/**
 * Calculates the N value from the given x and y coordinates.
 *
 * @param {number} x - The x-coordinate.
 * @param {number} y - The y-coordinate.
 * @returns {number} The N value.
 */
export function getNFromCoordinates(x: number, y: number): number | bigint;
export function getNFromCoordinates(x: bigint, y: bigint): bigint;
export function getNFromCoordinates(
  x: number | bigint,
  y: number | bigint,
): number | bigint;
export function getNFromCoordinates(
  x: number | bigint,
  y: number | bigint,
): number | bigint {
  if (typeof x === "bigint" || typeof y === "bigint") {
    if (typeof x !== "bigint" || typeof y !== "bigint") {
      throw new Error(
        "x and y must both be bigint when using BigInt coordinates.",
      );
    }
    return getNFromBigIntCoordinates(x, y);
  }

  if (shouldUseBigIntCoordinates(x, y)) {
    return getNFromBigIntCoordinates(BigInt(x), BigInt(y));
  }

  // Direct return for origin (0, 0)
  if (x === 0 && y === 0) return 1;

  // Calculate the squared sum of coordinates
  const m = x * x + y * y;

  // Calculate countLatticePoints(m-1) to find offset
  const s_m_minus_1 = m > 0 ? countLatticePoints(m - 1) : 0;

  const k = getShellIndex(m, x, y);

  // Return the computed index n
  return s_m_minus_1 + k;
}

/**
 * Calculates the coordinates from the given N value.
 *
 * @param {number} n - The N value.
 * @returns {{ x: number; y: number }} The coordinates {x, y}.
 */
export function getCoordinates(n: number): { x: number; y: number };
export function getCoordinates(n: bigint): { x: bigint; y: bigint };
export function getCoordinates(
  n: number | bigint,
): { x: number; y: number } | { x: bigint; y: bigint };
export function getCoordinates(
  n: number | bigint,
): { x: number; y: number } | { x: bigint; y: bigint } {
  if (typeof n === "bigint") return getBigIntCoordinates(n);

  if (n <= 0) throw new Error("Invalid value for n.");
  if (n === 1) return { x: 0, y: 0 };
  if (Number.isInteger(n) && n >= Number(BIGINT_COORDINATE_SEARCH_THRESHOLD)) {
    const coordinates = getBigIntCoordinates(BigInt(n));
    return { x: Number(coordinates.x), y: Number(coordinates.y) };
  }

  // Approximate m by using n
  const approx_m = Math.floor(n / Math.PI);
  // Define delta to narrow down the search range
  const delta = Math.ceil(Math.sqrt(n));

  // Binary search to find the smallest m where s(m) >= n
  let low = Math.max(0, approx_m - delta);
  let high = approx_m + delta;
  let lastBelowCount = 0;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const midCount = countLatticePoints(mid);
    if (midCount < n) {
      lastBelowCount = midCount;
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  const m = low;

  // Calculate s(m-1) to determine the offset
  const s_m_minus_1 = m > 0 ? lastBelowCount : 0;
  const k = n - s_m_minus_1;

  const shell = getShell(m);

  // Return the k-th point
  const [x, y] = shell.points[k - 1]!;
  return { x, y };
}

type Shell = {
  points: [number, number][];
  indexByCoordinate: Map<string, number>;
};

let spiralCacheEnabled = false;
const latticePointCountCache = new Map<number, number>();
const shellCache = new Map<number, Shell>();
const CONVEX_HULL_COUNT_THRESHOLD = 1_000_000_000;
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_FAST_BIGINT_ROOT = 10n ** 30n;
const MAX_NUMBER_GUIDED_BIGINT_ROOT = 200_000_000_000n;
const BIGINT_CONVEX_HULL_NAIVE_THRESHOLD_DIVISOR = 128;
const BIGINT_SHELL_SCAN_SEARCH_THRESHOLD = 1024n;
const BIGINT_LARGE_SHELL_SCAN_SEARCH_THRESHOLD = 8192n;
const BIGINT_LARGE_SHELL_SCAN_MIN_M = 10n ** 18n;
const BIGINT_COORDINATE_SEARCH_THRESHOLD = 100_000_000_000_000n;
const NUMBER_GUIDED_POINT_CHECK_EPSILON = 65_536;
const NUMBER_GUIDED_POINT_CHECK_ULP_FACTOR = 512;
const NUMBER_GUIDED_LARGE_POINT_CHECK_ULP_FACTOR = 0.5;
const NUMBER_GUIDED_DYNAMIC_EPSILON_THRESHOLD = 4e20;

export function setSpiralCacheEnabled(enabled: boolean): void {
  spiralCacheEnabled = enabled;
  if (!enabled) clearSpiralCache();
}

export function isSpiralCacheEnabled(): boolean {
  return spiralCacheEnabled;
}

export function clearSpiralCache(): void {
  latticePointCountCache.clear();
  shellCache.clear();
  bigIntLatticePointCountCache.clear();
  bigIntShellCache.clear();
}

/**
 * Calculates the number of lattice points where x^2 + y^2 <= m (optimized version)
 *
 * @param {number} m - The value m.
 * @returns {number} The number of lattice points.
 */
function countLatticePoints(m: number): number {
  if (m < 0) return 0;
  if (spiralCacheEnabled) {
    const cached = latticePointCountCache.get(m);
    if (cached !== undefined) return cached;
  }

  const count =
    m >= CONVEX_HULL_COUNT_THRESHOLD
      ? countLatticePointsByConvexHullFlat(m)
      : countLatticePointsByQuadrant(m);

  if (spiralCacheEnabled) latticePointCountCache.set(m, count);
  return count;
}

function countLatticePointsByQuadrant(m: number): number {
  if (m === 0) return 1;

  const r = Math.floor(Math.sqrt(m));
  let interiorQuadrantCount = 0;

  for (let x = 1; x <= r; x++) {
    interiorQuadrantCount += Math.floor(Math.sqrt(m - x * x));
  }

  return 4 * (interiorQuadrantCount + r) + 1;
}

function countLatticePointsByConvexHullFlat(m: number): number {
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
      if (!pointInCircle(nextX, nextY, m)) break;

      count += slopeX * nextY + ((slopeX - 1) * (slopeY - 1)) / 2;
      currentX = nextX;
      currentY = nextY;
    }

    if (currentX >= sqrt - naiveThreshold) break;

    while (
      !pointInCircle(
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

      if (pointInCircle(nextX, nextY, m)) {
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

function maxYInCircle(x: number, m: number): number {
  return Math.floor(Math.sqrt(m - x * x));
}

function pointInCircle(x: number, y: number, m: number): boolean {
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
      [-y, -x],
    );
  }
}

function getShell(m: number): Shell {
  if (spiralCacheEnabled) {
    const cached = shellCache.get(m);
    if (cached) return cached;
  }

  const points = getSymmetricPoints(m);
  points.sort(compareByAngleDescending);

  const indexByCoordinate = new Map<string, number>();
  points.forEach(([x, y], index) => {
    indexByCoordinate.set(`${x},${y}`, index + 1);
  });

  const shell = { points, indexByCoordinate };
  if (spiralCacheEnabled) shellCache.set(m, shell);
  return shell;
}

function getShellIndex(m: number, x: number, y: number): number {
  if (spiralCacheEnabled) {
    const cached = shellCache.get(m);
    if (cached) {
      const k = cached.indexByCoordinate.get(`${x},${y}`);
      if (k === undefined) throw new Error("Invalid coordinates.");
      return k;
    }
  }

  let count = 0;
  let found = false;
  for (const [px, py] of getSymmetricPoints(m)) {
    if (px === x && py === y) found = true;
    if (isAngleGreater(px, py, x, y)) count++;
  }

  if (!found) throw new Error("Invalid coordinates.");
  return count + 1;
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

function angleHalf([, y]: [number, number]): 0 | 1 {
  return y >= 0 ? 0 : 1;
}

function compareByAngleDescending(
  a: [number, number],
  b: [number, number],
): number {
  const halfA = angleHalf(a);
  const halfB = angleHalf(b);
  if (halfA !== halfB) return halfA - halfB;
  if (a[1] === 0 && b[1] === 0) return a[0] - b[0];

  const cross = a[0] * b[1] - a[1] * b[0];
  if (cross !== 0) return cross < 0 ? -1 : 1;
  return 0;
}

function isAngleGreater(px: number, py: number, x: number, y: number): boolean {
  return compareByAngleDescending([px, py], [x, y]) < 0;
}

function shouldUseBigIntCoordinates(x: number, y: number): boolean {
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) {
    throw new Error("x and y must be safe integers when using number inputs.");
  }

  return !Number.isSafeInteger(x * x + y * y);
}

type BigIntShell = {
  points: [bigint, bigint][];
  indexByCoordinate: Map<string, bigint>;
};
type BigIntCountFunction = (m: bigint) => bigint;

const bigIntLatticePointCountCache = new Map<bigint, bigint>();
const bigIntShellCache = new Map<bigint, BigIntShell>();
const SMALL_TRIAL_PRIMES = [
  3n,
  5n,
  7n,
  11n,
  13n,
  17n,
  19n,
  23n,
  29n,
  31n,
  37n,
  41n,
  43n,
  47n,
  53n,
  59n,
  61n,
  67n,
  71n,
  73n,
  79n,
  83n,
  89n,
  97n,
];

function getNFromBigIntCoordinates(x: bigint, y: bigint): bigint {
  const m = x * x + y * y;
  if (
    m <= MAX_SAFE_BIGINT &&
    x >= -MAX_SAFE_BIGINT &&
    x <= MAX_SAFE_BIGINT &&
    y >= -MAX_SAFE_BIGINT &&
    y <= MAX_SAFE_BIGINT
  ) {
    return BigInt(getNFromCoordinates(Number(x), Number(y)));
  }

  if (x === 0n && y === 0n) return 1n;

  const previousCount = m > 0n ? countBigIntLatticePoints(m - 1n) : 0n;
  const k = getBigIntShellIndex(m, x, y);

  return previousCount + k;
}

function getBigIntCoordinates(n: bigint): { x: bigint; y: bigint } {
  if (n <= 0n) throw new Error("Invalid value for n.");
  if (n === 1n) return { x: 0n, y: 0n };
  if (n <= MAX_SAFE_BIGINT && n < BIGINT_COORDINATE_SEARCH_THRESHOLD) {
    const coordinates = getCoordinates(Number(n));
    return { x: BigInt(coordinates.x), y: BigInt(coordinates.y) };
  }

  const count = createLocalBigIntCount();
  let { low, high } =
    getBigIntSearchBoundsByInterpolation(n, count) ??
    getBigIntSearchBounds(n, count);
  ({ low, high } = refineBigIntSearchBoundsByInterpolation(
    n,
    low,
    high,
    count,
  ));
  ({ low, high } = refineBigIntSearchBoundsBySecant(n, low, high, count));
  const scannedCoordinates = tryResolveBigIntCoordinatesByShellScan(
    n,
    low,
    high,
    count,
  );
  if (scannedCoordinates) return scannedCoordinates;

  while (low < high) {
    const mid = (low + high) / 2n;
    const midCount = count(mid);
    if (midCount < n) {
      low = mid + 1n;
    } else {
      high = mid;
    }
  }

  const previousCount = low > 0n ? count(low - 1n) : 0n;
  const shell = getBigIntShell(low);
  const k = n - previousCount;
  const [x, y] = shell.points[Number(k - 1n)]!;

  return { x, y };
}

function tryResolveBigIntCoordinatesByShellScan(
  n: bigint,
  low: bigint,
  high: bigint,
  count: BigIntCountFunction,
): { x: bigint; y: bigint } | undefined {
  const threshold = getBigIntShellScanSearchThreshold(high);
  if (low === 0n || high - low > threshold) {
    return undefined;
  }

  let cumulativeCount = count(low - 1n);

  for (let m = low; m <= high; m++) {
    const points = getBigIntPointsByFactorization(m);
    if (points.length === 0) continue;

    const shellCount = BigInt(points.length);
    const nextCumulativeCount = cumulativeCount + shellCount;
    if (nextCumulativeCount >= n) {
      points.sort(compareBigIntByAngleDescending);
      const [x, y] = points[Number(n - cumulativeCount - 1n)]!;
      return { x, y };
    }

    cumulativeCount = nextCumulativeCount;
  }

  return undefined;
}

function refineBigIntSearchBoundsBySecant(
  n: bigint,
  low: bigint,
  high: bigint,
  count: BigIntCountFunction,
): { low: bigint; high: bigint } {
  if (high - low <= getBigIntShellScanSearchThreshold(high))
    return { low, high };

  let lowCount = low > 0n ? count(low - 1n) : 0n;
  let highCount = count(high);

  for (
    let attempt = 0;
    attempt < 20 && high - low > getBigIntShellScanSearchThreshold(high);
    attempt++
  ) {
    const countSpan = highCount - lowCount;
    if (countSpan <= 0n) break;

    let current = low + ((n - lowCount) * (high - low)) / countSpan;
    if (current <= low) current = low + 1n;
    if (current >= high) current = high - 1n;

    const currentCount = count(current);
    if (currentCount < n) {
      low = current + 1n;
      lowCount = currentCount;
    } else {
      high = current;
      highCount = currentCount;
    }
  }

  return { low, high };
}

function refineBigIntSearchBoundsByInterpolation(
  n: bigint,
  low: bigint,
  high: bigint,
  count: BigIntCountFunction,
): { low: bigint; high: bigint } {
  let current = (low + high) / 2n;

  for (
    let attempt = 0;
    attempt < 8 && high - low > getBigIntShellScanSearchThreshold(high);
    attempt++
  ) {
    const currentCount = count(current);
    if (currentCount < n) {
      low = current + 1n;
    } else {
      high = current;
    }

    const countDelta = Number(n - currentCount);
    if (!Number.isFinite(countDelta)) break;

    const step = BigInt(Math.trunc(countDelta / Math.PI));
    const next = current + step;
    if (next <= low || next >= high) {
      current = (low + high) / 2n;
    } else {
      current = next;
    }
  }

  return { low, high };
}

function getBigIntShellScanSearchThreshold(m: bigint): bigint {
  return m >= BIGINT_LARGE_SHELL_SCAN_MIN_M
    ? BIGINT_LARGE_SHELL_SCAN_SEARCH_THRESHOLD
    : BIGINT_SHELL_SCAN_SEARCH_THRESHOLD;
}

function createLocalBigIntCount(): BigIntCountFunction {
  const localCounts = new Map<bigint, bigint>();

  return (m: bigint) => {
    const cached = localCounts.get(m);
    if (cached !== undefined) return cached;
    const count = countBigIntLatticePoints(m);
    localCounts.set(m, count);
    return count;
  };
}

function getBigIntSearchBoundsByInterpolation(
  n: bigint,
  count: BigIntCountFunction,
): { low: bigint; high: bigint } | undefined {
  const numericN = Number(n);
  if (!Number.isFinite(numericN)) return undefined;

  let low: bigint | undefined;
  let high: bigint | undefined;
  let current = BigInt(Math.max(0, Math.floor(numericN / Math.PI)));

  for (let attempt = 0; attempt < 8; attempt++) {
    const currentCount = count(current);
    if (currentCount < n) {
      low = current + 1n;
    } else {
      high = current;
    }

    if (low !== undefined && high !== undefined) {
      return low <= high ? { low, high } : undefined;
    }

    const countDelta = Number(n - currentCount);
    if (!Number.isFinite(countDelta)) return undefined;

    let step = BigInt(Math.trunc(countDelta / Math.PI));
    if (step === 0n) step = currentCount < n ? 1n : -1n;

    const next = current + step;
    current = next >= 0n ? next : 0n;
  }

  return undefined;
}

function getBigIntSearchBounds(
  n: bigint,
  count: BigIntCountFunction = countBigIntLatticePoints,
): { low: bigint; high: bigint } {
  const numericN = Number(n);
  if (!Number.isFinite(numericN)) return { low: 0n, high: n };

  const approx = BigInt(Math.max(0, Math.floor(numericN / Math.PI)));
  let delta = BigInt(Math.max(1, Math.ceil(Math.sqrt(numericN)))) * 4n;

  while (true) {
    const low = approx > delta ? approx - delta : 0n;
    const high = approx + delta;

    if ((low === 0n || count(low - 1n) < n) && count(high) >= n) {
      return { low, high };
    }

    delta *= 2n;
  }
}

function countBigIntLatticePoints(m: bigint): bigint {
  if (m < 0n) return 0n;
  if (spiralCacheEnabled) {
    const cached = bigIntLatticePointCountCache.get(m);
    if (cached !== undefined) return cached;
  }

  const count =
    m >= BigInt(CONVEX_HULL_COUNT_THRESHOLD)
      ? countBigIntLatticePointsByConvexHull(m)
      : countBigIntLatticePointsByQuadrant(m);
  if (spiralCacheEnabled) bigIntLatticePointCountCache.set(m, count);
  return count;
}

function countBigIntLatticePointsByQuadrant(m: bigint): bigint {
  if (m === 0n) return 1n;

  const r = integerSqrt(m);
  let interior = 0n;

  for (let x = 1n; x <= r; x++) {
    interior += integerSqrt(m - x * x);
  }

  return 4n * (interior + r) + 1n;
}

function countBigIntLatticePointsByConvexHull(m: bigint): bigint {
  if (m === 0n) return 1n;
  if (m <= MAX_SAFE_BIGINT) {
    return BigInt(countLatticePointsByConvexHullFlat(Number(m)));
  }

  const sqrtForGuidedPath = integerSqrt(m);
  if (sqrtForGuidedPath <= MAX_NUMBER_GUIDED_BIGINT_ROOT) {
    return countBigIntLatticePointsByNumberGuidedConvexHull(
      m,
      Number(sqrtForGuidedPath),
    );
  }

  let count = 0n;
  const stackX = [0n, 1n];
  const stackY = [1n, 0n];
  let stackLength = 2;

  const cbrt = integerCubeRoot(m);
  const sqrt = integerSqrt(m);
  const naiveThreshold = cbrt + 1n < sqrt ? cbrt + 1n : sqrt;

  for (let x = 1n; x <= naiveThreshold; x++) {
    count += maxBigIntYInCircle(x, m);
  }

  let currentX = naiveThreshold;
  let currentY = maxBigIntYInCircle(naiveThreshold, m);

  while (true) {
    stackLength--;
    let slopeX = stackX[stackLength]!;
    let slopeY = stackY[stackLength]!;

    while (true) {
      const nextX = currentX + slopeX;
      const nextY = currentY - slopeY;
      if (!bigIntPointInCircle(nextX, nextY, m)) break;

      count += slopeX * nextY + ((slopeX - 1n) * (slopeY - 1n)) / 2n;
      currentX = nextX;
      currentY = nextY;
    }

    if (currentX >= sqrt - naiveThreshold) break;

    while (
      !bigIntPointInCircle(
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

      if (bigIntPointInCircle(nextX, nextY, m)) {
        stackX[stackLength] = middleX;
        stackY[stackLength] = middleY;
        stackLength++;
      } else if (bigIntSlopeOutSquared(rightX, rightY, nextX, m)) {
        slopeX = middleX;
        slopeY = middleY;
      } else {
        break;
      }
    }
  }

  for (let x = currentX + 1n; x <= sqrt; x++) {
    count += maxBigIntYInCircle(x, m);
  }

  return 4n * (count + sqrt) + 1n;
}

function countBigIntLatticePointsByNumberGuidedConvexHull(
  m: bigint,
  sqrt: number,
): bigint {
  let count = 0n;
  const numericM = Number(m);
  const stackX = [0, 1];
  const stackY = [1, 0];
  let stackLength = 2;

  const cbrt = Number(integerCubeRoot(m));
  const naiveThreshold = Math.min(
    Math.max(
      1,
      Math.floor(cbrt / BIGINT_CONVEX_HULL_NAIVE_THRESHOLD_DIVISOR) + 1,
    ),
    sqrt,
  );

  count += sumNumberGuidedYInCircleRange(1, naiveThreshold, m, numericM);

  let currentX = naiveThreshold;
  let currentY = maxNumberGuidedYInCircle(naiveThreshold, m, numericM);

  while (true) {
    stackLength--;
    let slopeX = stackX[stackLength]!;
    let slopeY = stackY[stackLength]!;

    const bigSlopeX = BigInt(slopeX);
    const bigSlopeY = BigInt(slopeY);
    let bigCurrentY = BigInt(currentY);
    const areaCorrection = (BigInt(slopeX - 1) * (bigSlopeY - 1n)) / 2n;

    while (true) {
      const nextX = currentX + slopeX;
      const nextY = currentY - slopeY;
      if (!numberGuidedPointInCircle(nextX, nextY, m, numericM)) break;

      bigCurrentY -= bigSlopeY;
      count += bigSlopeX * bigCurrentY + areaCorrection;
      currentX = nextX;
      currentY = nextY;
    }

    if (currentX >= sqrt - naiveThreshold) break;

    while (
      !numberGuidedPointInCircle(
        currentX + stackX[stackLength - 1]!,
        currentY - stackY[stackLength - 1]!,
        m,
        numericM,
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

      if (numberGuidedPointInCircle(nextX, nextY, m, numericM)) {
        stackX[stackLength] = middleX;
        stackY[stackLength] = middleY;
        stackLength++;
      } else if (
        numberGuidedSlopeOutSquared(rightX, rightY, nextX, m, numericM)
      ) {
        slopeX = middleX;
        slopeY = middleY;
      } else {
        break;
      }
    }
  }

  count += sumNumberGuidedYInCircleRange(currentX + 1, sqrt, m, numericM);

  return 4n * (count + BigInt(sqrt)) + 1n;
}

function sumNumberGuidedYInCircleRange(
  start: number,
  end: number,
  m: bigint,
  numericM: number,
): bigint {
  if (start > end) return 0n;

  let total = 0n;
  let xSquared = BigInt(start) * BigInt(start);
  let squareStep = BigInt(2 * start + 1);

  for (let x = start; x <= end; x++) {
    total += BigInt(
      maxNumberGuidedYInCircleWithSquare(x, xSquared, m, numericM),
    );
    xSquared += squareStep;
    squareStep += 2n;
  }

  return total;
}

function maxNumberGuidedYInCircle(
  x: number,
  m: bigint,
  numericM: number,
): number {
  const bigX = BigInt(x);
  return maxNumberGuidedYInCircleWithSquare(x, bigX * bigX, m, numericM);
}

function maxNumberGuidedYInCircleWithSquare(
  x: number,
  xSquared: bigint,
  m: bigint,
  numericM: number,
): number {
  let y = Math.floor(Math.sqrt(Math.max(0, numericM - x * x)));
  let bigY = BigInt(y);
  let remaining = m - xSquared - bigY * bigY;

  while (remaining < 0n) {
    remaining += 2n * bigY - 1n;
    bigY--;
    y--;
  }

  while (remaining >= 2n * bigY + 1n) {
    remaining -= 2n * bigY + 1n;
    bigY++;
    y++;
  }

  return y;
}

function numberGuidedPointInCircle(
  x: number,
  y: number,
  m: bigint,
  numericM?: number,
): boolean {
  if (numericM !== undefined) {
    const delta = numericM - (x * x + y * y);
    const tolerance = getNumberGuidedPointCheckTolerance(numericM, x, y);
    if (delta > tolerance) return true;
    if (delta < -tolerance) return false;
  }

  const bigX = BigInt(x);
  const bigY = BigInt(y);
  return bigX * bigX + bigY * bigY <= m;
}

function getNumberGuidedPointCheckTolerance(
  numericM: number,
  x: number,
  y: number,
): number {
  if (numericM <= NUMBER_GUIDED_DYNAMIC_EPSILON_THRESHOLD) {
    return NUMBER_GUIDED_POINT_CHECK_EPSILON;
  }

  return (
    (Math.abs(numericM) + Math.abs(x * x) + Math.abs(y * y)) *
      Number.EPSILON *
      NUMBER_GUIDED_LARGE_POINT_CHECK_ULP_FACTOR +
    NUMBER_GUIDED_POINT_CHECK_EPSILON
  );
}

function numberGuidedSlopeOutSquared(
  slopeX: number,
  slopeY: number,
  x: number,
  m: bigint,
  numericM?: number,
): boolean {
  if (numericM !== undefined) {
    const xSquared = x * x;
    const left = slopeY * slopeY * (numericM - xSquared);
    const right = slopeX * slopeX * xSquared;
    const delta = left - right;
    const tolerance =
      (Math.abs(left) + Math.abs(right)) *
        Number.EPSILON *
        NUMBER_GUIDED_POINT_CHECK_ULP_FACTOR +
      NUMBER_GUIDED_POINT_CHECK_EPSILON;
    if (delta > tolerance) return true;
    if (delta < -tolerance) return false;
  }

  const bigSlopeX = BigInt(slopeX);
  const bigSlopeY = BigInt(slopeY);
  const bigSlopeXSquared = bigSlopeX * bigSlopeX;
  const bigSlopeYSquared = bigSlopeY * bigSlopeY;
  const bigX = BigInt(x);
  const bigXSquared = bigX * bigX;
  return bigSlopeYSquared * (m - bigXSquared) > bigSlopeXSquared * bigXSquared;
}

function maxBigIntYInCircle(x: bigint, m: bigint): bigint {
  return integerSqrt(m - x * x);
}

function bigIntPointInCircle(x: bigint, y: bigint, m: bigint): boolean {
  return x * x + y * y <= m;
}

function bigIntSlopeOutSquared(
  slopeX: bigint,
  slopeY: bigint,
  x: bigint,
  m: bigint,
): boolean {
  return slopeY * slopeY * (m - x * x) > slopeX * slopeX * x * x;
}

function getBigIntShell(m: bigint): BigIntShell {
  if (spiralCacheEnabled) {
    const cached = bigIntShellCache.get(m);
    if (cached) return cached;
  }

  const points = getBigIntSymmetricPoints(m);
  points.sort(compareBigIntByAngleDescending);

  const indexByCoordinate = new Map<string, bigint>();
  points.forEach(([x, y], index) => {
    indexByCoordinate.set(`${x},${y}`, BigInt(index + 1));
  });

  const shell = { points, indexByCoordinate };
  if (spiralCacheEnabled) bigIntShellCache.set(m, shell);
  return shell;
}

function getBigIntShellIndex(m: bigint, x: bigint, y: bigint): bigint {
  if (!spiralCacheEnabled) return getBigIntShellIndexDirect(m, x, y);

  const shell = getBigIntShell(m);
  const k = shell.indexByCoordinate.get(`${x},${y}`);
  if (k === undefined) throw new Error("Invalid coordinates.");
  return k;
}

function getBigIntShellIndexDirect(m: bigint, x: bigint, y: bigint): bigint {
  if (m >= 1_000_000_000_000n) {
    const shell = getBigIntShellByFactorization(m);
    const k = shell.indexByCoordinate.get(`${x},${y}`);
    if (k === undefined) throw new Error("Invalid coordinates.");
    return k;
  }

  let count = 0n;
  let found = false;
  const limit = integerSqrt(m / 2n);

  for (let representativeX = 0n; representativeX <= limit; representativeX++) {
    const ySquared = m - representativeX * representativeX;
    const representativeY = integerSqrt(ySquared);
    if (representativeY < representativeX) continue;
    if (representativeY * representativeY !== ySquared) continue;

    for (const [px, py] of getBigIntSymmetricPointCandidates(
      representativeX,
      representativeY,
    )) {
      if (px === x && py === y) found = true;
      if (compareBigIntByAngleDescending([px, py], [x, y]) < 0) count++;
    }
  }

  if (!found) throw new Error("Invalid coordinates.");
  return count + 1n;
}

function getBigIntShellByFactorization(m: bigint): BigIntShell {
  const points = getBigIntPointsByFactorization(m);
  points.sort(compareBigIntByAngleDescending);

  const indexByCoordinate = new Map<string, bigint>();
  points.forEach(([x, y], index) => {
    indexByCoordinate.set(`${x},${y}`, BigInt(index + 1));
  });

  return { points, indexByCoordinate };
}

function getBigIntPointsByFactorization(m: bigint): [bigint, bigint][] {
  if (m === 0n) return [[0n, 0n]];
  if (hasOddSmallThreeModFourFactor(m)) return [];

  const factors = factorBigInt(m);
  let scale = 1n;
  let reps: [bigint, bigint][] = [[1n, 0n]];

  for (const [prime, exponent] of factors) {
    if (prime === 2n) {
      const factor = gaussianBigIntPow([1n, 1n], exponent);
      reps = reps.map((rep) => gaussianBigIntMultiply(rep, factor));
    } else if (prime % 4n === 3n) {
      if (exponent % 2 !== 0) return [];
      scale *= prime ** BigInt(exponent / 2);
    } else {
      const primeRep = cornacchiaPrimeSumOfSquares(prime);
      const conjugate: [bigint, bigint] = [primeRep[0], -primeRep[1]];
      const options: [bigint, bigint][] = [];

      for (let k = 0; k <= exponent; k++) {
        options.push(
          gaussianBigIntMultiply(
            gaussianBigIntPow(primeRep, k),
            gaussianBigIntPow(conjugate, exponent - k),
          ),
        );
      }

      const nextReps: [bigint, bigint][] = [];
      for (const rep of reps) {
        for (const option of options) {
          nextReps.push(gaussianBigIntMultiply(rep, option));
        }
      }
      reps = nextReps;
    }
  }

  const points: [bigint, bigint][] = [];
  const seenRepresentatives = new Set<string>();

  for (const [real, imaginary] of reps) {
    const x = absBigInt(real * scale);
    const y = absBigInt(imaginary * scale);
    const a = x < y ? x : y;
    const b = x < y ? y : x;
    const key = `${a},${b}`;
    if (seenRepresentatives.has(key)) continue;
    seenRepresentatives.add(key);
    addBigIntSymmetricPoints(points, a, b);
  }

  return points;
}

function hasOddSmallThreeModFourFactor(value: bigint): boolean {
  let n = value;

  for (const prime of SMALL_TRIAL_PRIMES) {
    if (prime % 4n !== 3n || n % prime !== 0n) continue;

    let exponent = 0;
    do {
      exponent++;
      n /= prime;
    } while (n % prime === 0n);

    if (exponent % 2 !== 0) return true;
  }

  return false;
}

function getBigIntSymmetricPoints(m: bigint): [bigint, bigint][] {
  const points: [bigint, bigint][] = [];
  const limit = integerSqrt(m / 2n);

  for (let x = 0n; x <= limit; x++) {
    const ySquared = m - x * x;
    const y = integerSqrt(ySquared);
    if (y < x) continue;
    if (y * y === ySquared) addBigIntSymmetricPoints(points, x, y);
  }

  return points;
}

function addBigIntSymmetricPoints(
  points: [bigint, bigint][],
  x: bigint,
  y: bigint,
) {
  if (x === 0n && y === 0n) {
    points.push([0n, 0n]);
  } else if (x === 0n) {
    points.push([0n, y], [0n, -y], [y, 0n], [-y, 0n]);
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
      [-y, -x],
    );
  }
}

function getBigIntSymmetricPointCandidates(
  x: bigint,
  y: bigint,
): [bigint, bigint][] {
  if (x === 0n && y === 0n) return [[0n, 0n]];
  if (x === 0n)
    return [
      [0n, y],
      [0n, -y],
      [y, 0n],
      [-y, 0n],
    ];
  if (x === y)
    return [
      [x, y],
      [x, -y],
      [-x, y],
      [-x, -y],
    ];

  return [
    [x, y],
    [x, -y],
    [-x, y],
    [-x, -y],
    [y, x],
    [y, -x],
    [-y, x],
    [-y, -x],
  ];
}

function compareBigIntByAngleDescending(
  a: [bigint, bigint],
  b: [bigint, bigint],
): number {
  const halfA = a[1] >= 0n ? 0 : 1;
  const halfB = b[1] >= 0n ? 0 : 1;
  if (halfA !== halfB) return halfA - halfB;
  if (a[1] === 0n && b[1] === 0n) return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;

  const cross = a[0] * b[1] - a[1] * b[0];
  if (cross !== 0n) return cross < 0n ? -1 : 1;
  return 0;
}

function factorBigInt(value: bigint): Array<[bigint, number]> {
  const factors = new Map<bigint, number>();

  function addFactor(n: bigint): void {
    if (n === 1n) return;
    if (isProbablePrime(n)) {
      factors.set(n, (factors.get(n) ?? 0) + 1);
      return;
    }

    const divisor = pollardRho(n);
    addFactor(divisor);
    addFactor(n / divisor);
  }

  let n = value;
  while (n % 2n === 0n) {
    factors.set(2n, (factors.get(2n) ?? 0) + 1);
    n /= 2n;
  }

  for (const prime of SMALL_TRIAL_PRIMES) {
    while (n % prime === 0n) {
      factors.set(prime, (factors.get(prime) ?? 0) + 1);
      n /= prime;
    }
  }

  addFactor(n);
  return [...factors.entries()].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
}

function pollardRho(n: bigint): bigint {
  if (n % 2n === 0n) return 2n;
  if (n % 3n === 0n) return 3n;

  for (let c = 1n; ; c++) {
    let x = 2n;
    let y = 2n;
    let d = 1n;

    while (d === 1n) {
      x = pollardStep(x, c, n);
      y = pollardStep(pollardStep(y, c, n), c, n);
      d = gcd(absBigInt(x - y), n);
    }

    if (d !== n) return d;
  }
}

function pollardStep(x: bigint, c: bigint, mod: bigint): bigint {
  return (x * x + c) % mod;
}

function isProbablePrime(n: bigint): boolean {
  if (n < 2n) return false;
  const bases = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

  for (const base of bases) {
    if (n === base) return true;
    if (n % base === 0n) return false;
  }

  let d = n - 1n;
  let shifts = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    shifts++;
  }

  for (const base of bases) {
    if (base >= n - 1n) continue;
    let x = modPow(base, d, n);
    if (x === 1n || x === n - 1n) continue;

    let maybePrime = false;
    for (let r = 1; r < shifts; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        maybePrime = true;
        break;
      }
    }

    if (!maybePrime) return false;
  }

  return true;
}

function cornacchiaPrimeSumOfSquares(prime: bigint): [bigint, bigint] {
  const rootOfMinusOne = tonelliShanks(prime - 1n, prime);
  let a = prime;
  let b = rootOfMinusOne;

  while (b * b > prime) {
    const next = a % b;
    a = b;
    b = next;
  }

  const ySquared = prime - b * b;
  const y = integerSqrt(ySquared);
  if (y * y !== ySquared) {
    throw new Error(`No sum-of-squares representation for prime ${prime}`);
  }

  return [b, y];
}

function tonelliShanks(n: bigint, prime: bigint): bigint {
  if (n === 0n) return 0n;
  if (prime === 2n) return n;
  if (modPow(n, (prime - 1n) / 2n, prime) !== 1n) {
    throw new Error("No modular square root exists.");
  }
  if (prime % 4n === 3n) return modPow(n, (prime + 1n) / 4n, prime);

  let q = prime - 1n;
  let s = 0n;
  while (q % 2n === 0n) {
    q /= 2n;
    s++;
  }

  let z = 2n;
  while (modPow(z, (prime - 1n) / 2n, prime) !== prime - 1n) z++;

  let m = s;
  let c = modPow(z, q, prime);
  let t = modPow(n, q, prime);
  let r = modPow(n, (q + 1n) / 2n, prime);

  while (t !== 1n) {
    let i = 1n;
    let t2i = (t * t) % prime;
    while (t2i !== 1n) {
      t2i = (t2i * t2i) % prime;
      i++;
    }

    const b = modPow(c, 1n << (m - i - 1n), prime);
    m = i;
    c = (b * b) % prime;
    t = (t * c) % prime;
    r = (r * b) % prime;
  }

  return r;
}

function gaussianBigIntPow(
  base: [bigint, bigint],
  exponent: number,
): [bigint, bigint] {
  let result: [bigint, bigint] = [1n, 0n];
  let power = base;
  let n = exponent;

  while (n > 0) {
    if (n & 1) result = gaussianBigIntMultiply(result, power);
    power = gaussianBigIntMultiply(power, power);
    n = Math.floor(n / 2);
  }

  return result;
}

function gaussianBigIntMultiply(
  a: [bigint, bigint],
  b: [bigint, bigint],
): [bigint, bigint] {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}

function modPow(base: bigint, exponent: bigint, mod: bigint): bigint {
  let result = 1n;
  let power = base % mod;
  let n = exponent;

  while (n > 0n) {
    if (n & 1n) result = (result * power) % mod;
    power = (power * power) % mod;
    n >>= 1n;
  }

  return result;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;

  while (y !== 0n) {
    const next = x % y;
    x = y;
    y = next;
  }

  return x;
}

function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function integerSqrt(value: bigint): bigint {
  if (value < 0n)
    throw new Error("Cannot calculate square root of negative bigint.");
  if (value < 2n) return value;

  if (value <= MAX_FAST_BIGINT_ROOT) {
    let root = BigInt(Math.floor(Math.sqrt(Number(value))));
    while ((root + 1n) * (root + 1n) <= value) root++;
    while (root * root > value) root--;
    return root;
  }

  let x0 = 1n << (BigInt(value.toString(2).length + 1) / 2n);
  let x1 = (x0 + value / x0) / 2n;

  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + value / x0) / 2n;
  }

  return x0;
}

function integerCubeRoot(value: bigint): bigint {
  if (value < 0n)
    throw new Error("Cannot calculate cube root of negative bigint.");
  if (value < 8n) return value >= 1n ? 1n : 0n;

  if (value <= MAX_FAST_BIGINT_ROOT) {
    let root = BigInt(Math.floor(Math.cbrt(Number(value))));
    while ((root + 1n) * (root + 1n) * (root + 1n) <= value) root++;
    while (root * root * root > value) root--;
    return root;
  }

  let low = 0n;
  let high = 1n << (BigInt(value.toString(2).length + 2) / 3n);

  while (low <= high) {
    const mid = (low + high) / 2n;
    const cube = mid * mid * mid;
    if (cube === value) return mid;
    if (cube < value) low = mid + 1n;
    else high = mid - 1n;
  }

  return high;
}
