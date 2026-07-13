import { getCoordinates, getNFromCoordinates } from "./spiral.js";
import { countBigIntLatticePoints } from "./spiral-bigint-lattice.js";
import {
  compareBigIntByAngleDescending,
  getBigIntPointsByFactorization,
  getBigIntShell,
  getBigIntShellIndex,
} from "./spiral-bigint-shell.js";

type BigIntCountFunction = (m: bigint) => bigint;

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const BIGINT_SHELL_SCAN_SEARCH_THRESHOLD = 1024n;
const BIGINT_LARGE_SHELL_SCAN_SEARCH_THRESHOLD = 8192n;
const BIGINT_LARGE_SHELL_SCAN_MIN_M = 10n ** 18n;
export const BIGINT_COORDINATE_SEARCH_THRESHOLD = 100_000_000_000_000n;

export function getNFromBigIntCoordinates(x: bigint, y: bigint): bigint {
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

export function getBigIntCoordinates(n: bigint): { x: bigint; y: bigint } {
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
