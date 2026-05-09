import { getCoordinates, getNFromCoordinates } from "../src/spiral.js";

const MAX_EXHAUSTIVE_N = Number(process.env.MAX_EXHAUSTIVE_N ?? 250_000);
const MAX_GRID_RADIUS = Number(process.env.MAX_GRID_RADIUS ?? 500);
const MAX_N = Number(process.env.MAX_N ?? 100_000_000);

function oldGetNFromCoordinates(x: number, y: number): number {
  if (x === 0 && y === 0) return 1;

  const m = x * x + y * y;
  const sMMinus1 = m > 0 ? oldCountLatticePoints(m - 1) : 0;
  const points = oldGetPoints(m);
  let count = 0;

  for (const [px, py] of points) if (oldIsAngleGreater(px, py, x, y)) count++;

  return sMMinus1 + count + 1;
}

function oldGetCoordinates(n: number): { x: number; y: number } {
  if (n <= 0) throw new Error("Invalid value for n.");
  if (n === 1) return { x: 0, y: 0 };

  const approxM = Math.floor(n / Math.PI);
  const delta = Math.ceil(Math.sqrt(n));
  let low = Math.max(0, approxM - delta);
  let high = approxM + delta;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (oldCountLatticePoints(mid) < n) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  const m = low;
  const sMMinus1 = m > 0 ? oldCountLatticePoints(m - 1) : 0;
  const k = n - sMMinus1;
  const points = oldGetPoints(m);
  points.sort((a, b) => Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0]));

  const [x, y] = points[k - 1]!;
  return { x, y };
}

function oldCountLatticePoints(m: number): number {
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

function oldGetPoints(m: number): [number, number][] {
  const points: [number, number][] = [];
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

function oldIsAngleGreater(
  px: number,
  py: number,
  x: number,
  y: number
): boolean {
  const atan2A = Math.atan2(py, px);
  const atan2B = Math.atan2(y, x);
  if (atan2A === atan2B) return false;
  return atan2A > atan2B;
}

function assertCoordinateMatch(n: number) {
  const expected = oldGetCoordinates(n);
  const actual = getCoordinates(n);

  if (expected.x !== actual.x || expected.y !== actual.y) {
    throw new Error(
      `n->xy mismatch for n=${n}: expected ${expected.x},${expected.y}, actual ${actual.x},${actual.y}`
    );
  }
}

function assertNMatch(x: number, y: number) {
  const expected = oldGetNFromCoordinates(x, y);
  const actual = getNFromCoordinates(x, y);

  if (expected !== actual) {
    throw new Error(
      `xy->n mismatch for ${x},${y}: expected ${expected}, actual ${actual}`
    );
  }
}

console.time(`exhaustive n->xy 1..${MAX_EXHAUSTIVE_N}`);
for (let n = 1; n <= MAX_EXHAUSTIVE_N; n++) assertCoordinateMatch(n);
console.timeEnd(`exhaustive n->xy 1..${MAX_EXHAUSTIVE_N}`);

console.time(`exhaustive xy->n square radius ${MAX_GRID_RADIUS}`);
for (let x = -MAX_GRID_RADIUS; x <= MAX_GRID_RADIUS; x++) {
  for (let y = -MAX_GRID_RADIUS; y <= MAX_GRID_RADIUS; y++) {
    assertNMatch(x, y);
  }
}
console.timeEnd(`exhaustive xy->n square radius ${MAX_GRID_RADIUS}`);

const boundaryNs = new Set<number>();
for (const n of [
  1,
  2,
  3,
  4,
  5,
  10,
  100,
  1_000,
  10_000,
  100_000,
  1_000_000,
  10_000_000,
  MAX_N - 10,
  MAX_N - 1,
  MAX_N,
]) {
  if (n > 0 && n <= MAX_N) boundaryNs.add(n);
}

for (let r = 1; r <= Math.floor(Math.sqrt(MAX_N / Math.PI)); r *= 2) {
  const approx = Math.max(1, Math.floor(Math.PI * r * r));
  for (let delta = -5; delta <= 5; delta++) {
    const n = approx + delta;
    if (n > 0 && n <= MAX_N) boundaryNs.add(n);
  }
}

console.time(`boundary n->xy ${boundaryNs.size} cases`);
for (const n of boundaryNs) assertCoordinateMatch(n);
console.timeEnd(`boundary n->xy ${boundaryNs.size} cases`);

const boundaryCoordinates = new Set<string>();
for (let r = 0; r <= 10_000; r = r === 0 ? 1 : r * 2) {
  for (const [x, y] of [
    [r, 0],
    [-r, 0],
    [0, r],
    [0, -r],
    [r, r],
    [r, -r],
    [-r, r],
    [-r, -r],
    [r, Math.floor(r / 2)],
    [-r, Math.floor(r / 2)],
    [Math.floor(r / 2), r],
    [Math.floor(r / 2), -r],
  ]) {
    boundaryCoordinates.add(`${x},${y}`);
  }
}

console.time(`boundary xy->n ${boundaryCoordinates.size} cases`);
for (const coordinate of boundaryCoordinates) {
  const [x, y] = coordinate.split(",").map(Number) as [number, number];
  assertNMatch(x, y);
}
console.timeEnd(`boundary xy->n ${boundaryCoordinates.size} cases`);

console.log("edge-case mismatches=0");
