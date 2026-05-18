import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(
    new URL("../apps/api-ground-codes/package.json", import.meta.url),
  ),
);

const expectedPins = {
  "ground-codes":
    "git+https://github.com/hmmhmmhm/ground.codes.git#railway-api-runtime-20260518-search-bias&path:packages/ground-codes",
  "@ground-codes/geoint":
    "git+https://github.com/hmmhmmhm/ground.codes.git#railway-api-runtime-20260518-search-bias&path:packages/geoint",
  "@repo/codebook":
    "git+https://github.com/hmmhmmhm/ground.codes.git#railway-api-runtime-20260518-search-bias&path:packages/codebook",
};

const failures = Object.entries(expectedPins).flatMap(([name, expected]) => {
  const actual = packageJson.dependencies?.[name];
  return actual === expected
    ? []
    : [`${name} expected ${expected}, found ${actual ?? "missing"}`];
});

if (failures.length > 0) {
  console.error("API runtime package pins are not aligned:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("API runtime package pins are aligned.");
