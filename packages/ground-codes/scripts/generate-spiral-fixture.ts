import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getCoordinates, getNFromCoordinates } from "../src/spiral.js";

const COUNT = 10_000;
const scriptDir = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(scriptDir, "..", "test", "fixtures", "spiral-10000.json");

const coordinatesByN = Array.from({ length: COUNT }, (_, index) => {
  const n = index + 1;
  const { x, y } = getCoordinates(n);
  return { n, x, y };
});

const nByCoordinate = coordinatesByN.map(({ x, y }) => ({
  x,
  y,
  n: getNFromCoordinates(x, y),
}));

mkdirSync(dirname(fixturePath), { recursive: true });
writeFileSync(
  fixturePath,
  `${JSON.stringify(
    {
      generatedFrom: "packages/ground-codes/src/spiral.ts",
      count: COUNT,
      coordinatesByN,
      nByCoordinate,
    },
    null,
    2
  )}\n`
);

console.log(`Wrote ${COUNT} baseline spiral cases to ${fixturePath}`);
