import {
  clearSpiralCache,
  getCoordinates,
  getNFromCoordinates,
  setSpiralCacheEnabled,
} from "../src/spiral.js";

const CASES = Number(process.env.CASES ?? 10_000);
const MAX_N = Number(process.env.MAX_N ?? 1_000_000);
const SEED = Number(process.env.SEED ?? 0xb16147);
const CACHE = process.env.SPIRAL_CACHE === "1";

setSpiralCacheEnabled(CACHE);
clearSpiralCache();

function createRandom(seedInput: number) {
  let seed = seedInput;
  return {
    int(min: number, max: number) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return min + Math.floor((seed / 0x100000000) * (max - min + 1));
    },
  };
}

const rng = createRandom(SEED);

console.log(`seed=${SEED} cases=${CASES} maxN=${MAX_N} spiralCache=${CACHE}`);

console.time("number-compatible bigint random roundtrip");
for (let i = 0; i < CASES; i++) {
  const n = rng.int(1, MAX_N);
  const numberCoordinates = getCoordinates(n);
  const bigIntCoordinates = getCoordinates(BigInt(n));

  if (
    BigInt(numberCoordinates.x) !== bigIntCoordinates.x ||
    BigInt(numberCoordinates.y) !== bigIntCoordinates.y
  ) {
    throw new Error(`n->xy mismatch at n=${n}`);
  }

  const numberN = getNFromCoordinates(numberCoordinates.x, numberCoordinates.y);
  const bigIntN = getNFromCoordinates(bigIntCoordinates.x, bigIntCoordinates.y);
  if (BigInt(numberN) !== bigIntN) {
    throw new Error(`xy->n mismatch at n=${n}`);
  }
}
console.timeEnd("number-compatible bigint random roundtrip");

const bigIntCoordinates = [
  [10_000n, 10_000n],
  [100_000n, -1n],
  [-123_456n, 9_876n],
] as const;

console.time("bigint coordinate roundtrip");
for (const [x, y] of bigIntCoordinates) {
  const n = getNFromCoordinates(x, y);
  const coordinates = getCoordinates(n);
  if (coordinates.x !== x || coordinates.y !== y) {
    throw new Error(
      `bigint roundtrip mismatch: ${x},${y} -> ${n} -> ${coordinates.x},${coordinates.y}`,
    );
  }
  console.log(`${x},${y} -> ${n}`);
}
console.timeEnd("bigint coordinate roundtrip");
