import { readFileSync, writeFileSync } from "node:fs";

import {
  getRuntimePinFailures,
  updateRuntimePins,
} from "./api-runtime-pins.mjs";

const tag = process.argv[2]?.trim();

if (!tag) {
  console.error("Usage: pnpm runtime:update-pins <git-tag>");
  process.exit(1);
}

const packageJsonUrl = new URL(
  "../apps/api-ground-codes/package.json",
  import.meta.url,
);
const packageJson = JSON.parse(readFileSync(packageJsonUrl, "utf8"));
const changed = updateRuntimePins(packageJson, tag);
const failures = getRuntimePinFailures(packageJson, tag);

if (failures.length > 0) {
  console.error("Refusing to write incomplete API runtime pins:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

writeFileSync(packageJsonUrl, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(
  changed
    ? `API runtime and exact Elysia package pins updated to ${tag}.`
    : `API runtime and exact Elysia package pins already use ${tag}.`,
);
