const MAX_FAST_BIGINT_ROOT = 10n ** 30n;

export const SMALL_TRIAL_PRIMES = [
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

export function factorBigInt(value: bigint): Array<[bigint, number]> {
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

export function pollardRho(n: bigint): bigint {
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

export function pollardStep(x: bigint, c: bigint, mod: bigint): bigint {
  return (x * x + c) % mod;
}

export function isProbablePrime(n: bigint): boolean {
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

export function cornacchiaPrimeSumOfSquares(prime: bigint): [bigint, bigint] {
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

export function tonelliShanks(n: bigint, prime: bigint): bigint {
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

export function gaussianBigIntPow(
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

export function gaussianBigIntMultiply(
  a: [bigint, bigint],
  b: [bigint, bigint],
): [bigint, bigint] {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}

export function modPow(base: bigint, exponent: bigint, mod: bigint): bigint {
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

export function gcd(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;

  while (y !== 0n) {
    const next = x % y;
    x = y;
    y = next;
  }

  return x;
}

export function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

export function integerSqrt(value: bigint): bigint {
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

export function integerCubeRoot(value: bigint): bigint {
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
