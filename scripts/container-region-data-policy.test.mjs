import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("materializes both region groups before API container builds", () => {
  for (const path of ["Dockerfile", "apps/api-ground-codes/Dockerfile"]) {
    const dockerfile = read(path);
    const sync =
      "node scripts/sync-region-data.mjs --groups region-dist,region-db --prune";
    assert.match(dockerfile, /ARG REGION_DATA_BASE_URL=/);
    assert.ok(dockerfile.includes(sync), `${path} must sync both groups`);
    assert.ok(
      dockerfile.indexOf(sync) < dockerfile.indexOf("api-ground-codes build"),
    );
  }
  assert.match(read("apps/api-ground-codes/Dockerfile"), /\n    scripts \\\n/);
  const dockerIgnore = read(".dockerignore");
  assert.match(dockerIgnore, /^packages\/geoint\/region-dist\/?$/m);
  assert.match(dockerIgnore, /^packages\/geoint\/region-db\/?$/m);
});
