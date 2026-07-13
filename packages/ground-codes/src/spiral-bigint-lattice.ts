import {
  bigIntLatticePointCountCache,
  spiralCacheEnabled,
} from "./spiral-cache.js";
import { integerCubeRoot, integerSqrt } from "./spiral-bigint-number-theory.js";
import {
  CONVEX_HULL_COUNT_THRESHOLD,
  countLatticePointsByConvexHullFlat,
} from "./spiral.js";

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_NUMBER_GUIDED_BIGINT_ROOT = 200_000_000_000n;
const BIGINT_CONVEX_HULL_NAIVE_THRESHOLD_DIVISOR = 128;
const NUMBER_GUIDED_POINT_CHECK_EPSILON = 65_536;
const NUMBER_GUIDED_POINT_CHECK_ULP_FACTOR = 512;
const NUMBER_GUIDED_LARGE_POINT_CHECK_ULP_FACTOR = 0.5;
const NUMBER_GUIDED_DYNAMIC_EPSILON_THRESHOLD = 4e20;

export function countBigIntLatticePoints(m: bigint): bigint {
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
