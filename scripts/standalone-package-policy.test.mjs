import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const checker = readFileSync(
  new URL(
    "../packages/ground-codes/scripts/check-standalone-package.mjs",
    import.meta.url,
  ),
  "utf8",
);

test("standalone consumer approves the reviewed native database build", () => {
  assert.match(
    checker,
    /run\(\s*"pnpm",\s*\[\s*"add",\s*"--allow-build=classic-level",\s*tarballPath\s*\],\s*consumerRoot,?\s*\);/s,
  );
});
