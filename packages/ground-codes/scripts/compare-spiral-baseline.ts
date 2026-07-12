import {
  clearSpiralCache,
  getCoordinates,
  getNFromCoordinates,
  setSpiralCacheEnabled,
} from "../src/spiral.js";

const MAX_N = Number(process.env.MAX_N ?? 100_000_000);
const CASES = Number(process.env.CASES ?? 100_000);
const seedStart = Number(process.env.SEED ?? 0x5eed1234);
const CACHE = process.env.SPIRAL_CACHE === "1";

setSpiralCacheEnabled(CACHE);
clearSpiralCache();
let seed = seedStart;

function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
}

function randomInt(min: number, max: number) {
  return min + Math.floor(random() * (max - min + 1));
}

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
  y: number,
): boolean {
  const atan2A = Math.atan2(py, px);
  const atan2B = Math.atan2(y, x);
  if (atan2A === atan2B) return false;
  return atan2A > atan2B;
}

function fail(
  kind: string,
  input: unknown,
  oldValue: unknown,
  newValue: unknown,
) {
  console.error(JSON.stringify({ kind, input, oldValue, newValue }, null, 2));
  process.exit(1);
}

console.log(
  `seed=${seedStart} maxN=${MAX_N} cases=${CASES} spiralCache=${CACHE}`,
);

console.time("random n -> xy compare");
for (let i = 0; i < CASES; i++) {
  const n = randomInt(1, MAX_N);
  const oldValue = oldGetCoordinates(n);
  const newValue = getCoordinates(n);

  if (oldValue.x !== newValue.x || oldValue.y !== newValue.y) {
    fail("n->xy mismatch", { n, i }, oldValue, newValue);
  }
}
console.timeEnd("random n -> xy compare");

console.time("random xy -> n compare");
for (let i = 0; i < CASES; i++) {
  const n = randomInt(1, MAX_N);
  const { x, y } = oldGetCoordinates(n);
  const oldValue = oldGetNFromCoordinates(x, y);
  const newValue = getNFromCoordinates(x, y);

  if (oldValue !== newValue) {
    fail("xy->n mismatch", { x, y, sourceN: n, i }, oldValue, newValue);
  }
}
console.timeEnd("random xy -> n compare");

console.log("mismatches=0");
