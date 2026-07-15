import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";

import { load } from "../src/index";

const temporaryDirectories: string[] = [];
const originalEnvironmentDataDir = process.env.GROUND_CODES_REGION_DB_DIR;

afterEach(async () => {
  if (originalEnvironmentDataDir === undefined) {
    delete process.env.GROUND_CODES_REGION_DB_DIR;
  } else {
    process.env.GROUND_CODES_REGION_DB_DIR = originalEnvironmentDataDir;
  }
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

const emptyDataDirectory = async () => {
  const directory = await mkdtemp(join(tmpdir(), "geoint-region-db-"));
  temporaryDirectories.push(directory);
  return directory;
};

test("load accepts an explicit materialized region database directory", async () => {
  const dataDir = await emptyDataDirectory();
  await assert.doesNotReject(load([], { dataDir }));
});

test("load honors GROUND_CODES_REGION_DB_DIR", async () => {
  process.env.GROUND_CODES_REGION_DB_DIR = await emptyDataDirectory();
  await assert.doesNotReject(load());
});

test("load fails with an explicit sync instruction when data is absent", async () => {
  const dataDir = join(await emptyDataDirectory(), "missing");
  await assert.rejects(load([], { dataDir }), (error: unknown) => {
    assert.match(String(error), /region data is not materialized/i);
    assert.match(String(error), /pnpm region-data:sync/);
    assert.match(String(error), /GROUND_CODES_REGION_DB_DIR/);
    return true;
  });
});
