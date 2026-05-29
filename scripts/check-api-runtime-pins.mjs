import { readFileSync } from "node:fs";

import {
  getRuntimePinFailures,
  getRuntimeTag,
  usesWorkspaceRuntime,
} from "./api-runtime-pins.mjs";

const packageJson = JSON.parse(
  readFileSync(
    new URL("../apps/api-ground-codes/package.json", import.meta.url),
  ),
);

const runtimeTag = process.env.API_RUNTIME_TAG ?? getRuntimeTag(packageJson);

const failures =
  usesWorkspaceRuntime(packageJson) && !process.env.API_RUNTIME_TAG
    ? []
    : runtimeTag
      ? getRuntimePinFailures(packageJson, runtimeTag)
      : ["unable to infer API runtime tag from package pins"];

if (failures.length > 0) {
  console.error("API runtime package pins are not aligned:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  usesWorkspaceRuntime(packageJson) && !process.env.API_RUNTIME_TAG
    ? "API runtime packages use workspace dependencies."
    : `API runtime package pins are aligned on ${runtimeTag}.`,
);
