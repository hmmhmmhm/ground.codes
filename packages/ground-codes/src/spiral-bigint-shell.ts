import {
  type BigIntShell,
  bigIntShellCache,
  spiralCacheEnabled,
} from "./spiral-cache.js";
import {
  SMALL_TRIAL_PRIMES,
  absBigInt,
  cornacchiaPrimeSumOfSquares,
  factorBigInt,
  gaussianBigIntMultiply,
  gaussianBigIntPow,
  integerSqrt,
} from "./spiral-bigint-number-theory.js";

export function getBigIntShell(m: bigint): BigIntShell {
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

export function getBigIntShellIndex(m: bigint, x: bigint, y: bigint): bigint {
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

export function getBigIntPointsByFactorization(m: bigint): [bigint, bigint][] {
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

export function compareBigIntByAngleDescending(
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
