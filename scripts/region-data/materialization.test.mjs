import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";

import { assertMaterializedRegionData } from "./materialization.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

const temporaryRoot = async () => {
  const root = await mkdtemp(join(tmpdir(), "region-materialization-"));
  temporaryDirectories.push(root);
  return root;
};

test("accepts explicitly materialized group sentinels", async () => {
  const root = await temporaryRoot();
  await mkdir(join(root, "packages/geoint/region-dist"), { recursive: true });
  await mkdir(join(root, "packages/geoint/region-db"), { recursive: true });
  await writeFile(
    join(root, "packages/geoint/region-dist/region-1.json"),
    "[]",
  );
  await writeFile(
    join(root, "packages/geoint/region-db/region-1.index"),
    "index",
  );

  assert.doesNotThrow(() => assertMaterializedRegionData({ root }));
});

test("reports every missing group with the public sync command", async () => {
  const root = await temporaryRoot();

  assert.throws(
    () => assertMaterializedRegionData({ root }),
    (error) => {
      assert.match(String(error), /region-dist, region-db/);
      assert.match(String(error), /REGION_DATA_BASE_URL/);
      assert.match(String(error), /pnpm region-data:sync/);
      return true;
    },
  );
});

test("can require only the distribution group", async () => {
  const root = await temporaryRoot();
  await mkdir(join(root, "packages/geoint/region-dist"), { recursive: true });
  await writeFile(
    join(root, "packages/geoint/region-dist/region-1.json"),
    "[]",
  );

  assert.doesNotThrow(() =>
    assertMaterializedRegionData({ groups: ["region-dist"], root }),
  );
});

test("accepts an explicit group directory", async () => {
  const root = await temporaryRoot();
  const regionDist = join(root, "custom-region-dist");
  await mkdir(regionDist);
  await writeFile(join(regionDist, "region-1.json"), "[]");

  assert.doesNotThrow(() =>
    assertMaterializedRegionData({
      directories: { "region-dist": regionDist },
      groups: ["region-dist"],
      root,
    }),
  );
});

test("rejects a symlinked materialization directory", async () => {
  const root = await temporaryRoot();
  const external = join(root, "external-region-dist");
  const managed = join(root, "packages/geoint/region-dist");
  await mkdir(external);
  await mkdir(join(root, "packages/geoint"), { recursive: true });
  await writeFile(join(external, "region-1.json"), "[]");
  await symlink(external, managed, "dir");

  assert.throws(
    () => assertMaterializedRegionData({ groups: ["region-dist"], root }),
    /region-dist/,
  );
});
