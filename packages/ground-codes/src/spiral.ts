import {
  BIGINT_COORDINATE_SEARCH_THRESHOLD,
  getBigIntCoordinates,
  getNFromBigIntCoordinates,
} from "./spiral-bigint-search.js";
import {
  type Shell,
  clearSpiralCache,
  isSpiralCacheEnabled,
  latticePointCountCache,
  setSpiralCacheEnabled,
  shellCache,
  spiralCacheEnabled,
} from "./spiral-cache.js";

export { clearSpiralCache, isSpiralCacheEnabled, setSpiralCacheEnabled };

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

export const CONVEX_HULL_COUNT_THRESHOLD = 1_000_000_000;

/**
 * Calculates the number of lattice points where x^2 + y^2 <= m.
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

export function countLatticePointsByConvexHullFlat(m: number): number {
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
