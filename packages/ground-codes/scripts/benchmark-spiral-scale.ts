import { performance } from "node:perf_hooks";

import {
  clearSpiralCache,
  getCoordinates,
  getNFromCoordinates,
  isSpiralCacheEnabled,
  setSpiralCacheEnabled,
} from "../src/spiral.js";

const CASES = Number(process.env.CASES ?? 20_000);
const SEED = Number(process.env.SEED ?? 0x5ca1e);
const MAX_DIGITS = Number(process.env.MAX_DIGITS ?? 10);
const CACHE = process.env.SPIRAL_CACHE === "1";

setSpiralCacheEnabled(CACHE);
clearSpiralCache();

type Sample = {
  label: string;
  samples: number[];
};
type NumericInput = number | bigint;

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

function measure(
  samples: NumericInput[],
  callback: (value: NumericInput) => void
): Sample {
  const timings: number[] = [];

  for (const value of samples) {
    const startedAt = performance.now();
    callback(value);
    timings.push(performance.now() - startedAt);
  }

  return { label: "", samples: timings };
}

function summarize(label: string, samples: number[]) {
  samples.sort((a, b) => a - b);
  const total = samples.reduce((sum, value) => sum + value, 0);
  const avg = total / samples.length;
  const median = percentile(samples, 0.5);
  const p95 = percentile(samples, 0.95);
  const p99 = percentile(samples, 0.99);

  console.log(
    `${label}: avg=${formatMs(avg)} median=${formatMs(median)} p95=${formatMs(p95)} p99=${formatMs(p99)} min=${formatMs(samples[0]!)} max=${formatMs(samples[samples.length - 1]!)} cases=${samples.length}`
  );
}

function percentile(samples: number[], ratio: number) {
  return samples[Math.min(samples.length - 1, Math.floor(samples.length * ratio))]!;
}

function formatMs(value: number) {
  if (value < 1) return `${(value * 1000).toFixed(2)}us`;
  return `${value.toFixed(3)}ms`;
}

function rangeForDigits(digits: number) {
  const min = digits === 1 ? 1 : 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return { min, max };
}

function randomNumbersByDigits(digits: number) {
  const { min, max } = rangeForDigits(digits);
  return Array.from({ length: CASES }, () => rng.int(min, max));
}

function randomBigIntsByDigits(digits: number) {
  const min = digits === 1 ? 1n : 10n ** BigInt(digits - 1);
  const max = 10n ** BigInt(digits) - 1n;
  const span = max - min + 1n;

  return Array.from({ length: CASES }, () => {
    const high = BigInt(rng.int(0, 0xfffff));
    const low = BigInt(rng.int(0, 0xfffff));
    return min + ((high << 20n) + low) % span;
  });
}

function randomCoordinatesByDigits(digits: number) {
  const { min, max } = rangeForDigits(digits);
  return Array.from({ length: CASES }, () => {
    const signX = rng.int(0, 1) === 0 ? -1 : 1;
    const signY = rng.int(0, 1) === 0 ? -1 : 1;
    return {
      x: signX * rng.int(min, max),
      y: signY * rng.int(min, max),
    };
  });
}

console.log(
  `seed=${SEED} cases=${CASES} maxDigits=${MAX_DIGITS} spiralCache=${isSpiralCacheEnabled()}`
);

for (let digits = 1; digits <= MAX_DIGITS; digits++) {
  if (digits > 15 && process.env.RUN_SLOW_BIGINT !== "1") {
    console.log(
      `n->xy ${digits} digit n: skipped exact BigInt path; set RUN_SLOW_BIGINT=1 to run`
    );
    continue;
  }

  const values =
    digits <= 15 ? randomNumbersByDigits(digits) : randomBigIntsByDigits(digits);
  const result = measure(values, (n) => {
    getCoordinates(n);
  });
  summarize(`n->xy ${digits} digit n`, result.samples);
}

for (let digits = 1; digits <= MAX_DIGITS; digits++) {
  if (digits > 7 && process.env.RUN_SLOW_BIGINT !== "1") {
    console.log(
      `xy->n ${digits} digit |x|,|y|: skipped possible BigInt path; set RUN_SLOW_BIGINT=1 to run`
    );
    continue;
  }

  const values = randomCoordinatesByDigits(digits);
  const timings: number[] = [];

  for (const { x, y } of values) {
    const startedAt = performance.now();
    getNFromCoordinates(x, y);
    timings.push(performance.now() - startedAt);
  }

  summarize(`xy->n ${digits} digit |x|,|y|`, timings);
}
