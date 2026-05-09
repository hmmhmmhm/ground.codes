import { performance } from "node:perf_hooks";

import {
  clearSpiralCache,
  getCoordinates,
  getNFromCoordinates,
  setSpiralCacheEnabled,
} from "../src/spiral.js";

const COUNT = 10_000;
const ROUNDS = 5;
const CACHE = process.env.SPIRAL_CACHE === "1";

setSpiralCacheEnabled(CACHE);
clearSpiralCache();
console.log(`spiralCache=${CACHE}`);

function time(label: string, callback: () => void) {
  const samples: number[] = [];
  for (let round = 0; round < ROUNDS; round++) {
    const startedAt = performance.now();
    callback();
    samples.push(performance.now() - startedAt);
  }

  const total = samples.reduce((sum, sample) => sum + sample, 0);
  const average = total / samples.length;
  const best = Math.min(...samples);
  const worst = Math.max(...samples);

  console.log(
    `${label}: avg=${average.toFixed(2)}ms best=${best.toFixed(2)}ms worst=${worst.toFixed(2)}ms rounds=${ROUNDS}`
  );
}

const coordinates = Array.from({ length: COUNT }, (_, index) =>
  getCoordinates(index + 1)
);

time(`getCoordinates 1..${COUNT}`, () => {
  for (let n = 1; n <= COUNT; n++) getCoordinates(n);
});

time(`getNFromCoordinates first ${COUNT} generated coordinates`, () => {
  for (const { x, y } of coordinates) getNFromCoordinates(x, y);
});
