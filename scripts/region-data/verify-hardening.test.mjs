import assert from "node:assert/strict";
import {
  chmod,
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, test } from "node:test";

import { canonicalJson, createManifest } from "./manifest.mjs";
import { verifyRegionData } from "./verify.mjs";

const temporaryDirectories = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

const fixture = async () => {
  const container = await mkdtemp(join(tmpdir(), "verify-hardening-"));
  temporaryDirectories.push(container);
  const sourceRoot = join(container, "source");
  const materializedRoot = join(container, "materialized");
  for (const group of ["region-dist", "region-db"]) {
    await mkdir(join(sourceRoot, group), { recursive: true });
    await mkdir(join(materializedRoot, "packages/geoint", group), {
      recursive: true,
    });
  }
  const files = {
    "region-dist/sample.json": Buffer.from("dist"),
    "region-db/sample.index": Buffer.from("db"),
  };
  for (const [relativePath, bytes] of Object.entries(files)) {
    const source = join(sourceRoot, ...relativePath.split("/"));
    const materialized = join(
      materializedRoot,
      "packages/geoint",
      ...relativePath.split("/"),
    );
    await Promise.all([
      mkdir(dirname(source), { recursive: true }),
      mkdir(dirname(materialized), { recursive: true }),
    ]);
    await Promise.all([
      writeFile(source, bytes),
      writeFile(materialized, bytes),
    ]);
  }
  return { container, materializedRoot, sourceRoot };
};

test("rejects non-regular, malformed, and non-canonical manifests", async () => {
  const tree = await fixture();
  await assert.rejects(
    verifyRegionData({
      manifestPath: tree.sourceRoot,
      materializedRoot: tree.materializedRoot,
    }),
    /manifestPath must be a regular file/i,
  );

  const manifestPath = join(tree.container, "manifest.json");
  await writeFile(manifestPath, "{");
  await assert.rejects(
    verifyRegionData({
      manifestPath,
      materializedRoot: tree.materializedRoot,
    }),
    /manifest is invalid/i,
  );

  const manifest = await createManifest({ sourceRoot: tree.sourceRoot });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  await assert.rejects(
    verifyRegionData({
      manifestPath,
      materializedRoot: tree.materializedRoot,
    }),
    /not canonical JSON/i,
  );
  await writeFile(manifestPath, canonicalJson(manifest));
  assert.equal(
    (
      await verifyRegionData({
        manifestPath,
        materializedRoot: tree.materializedRoot,
      })
    ).ok,
    true,
  );
});

test("requires one expected-data source and a materialized root", async () => {
  const tree = await fixture();
  for (const options of [
    { materializedRoot: tree.materializedRoot },
    {
      sourceRoot: tree.sourceRoot,
      manifestPath: join(tree.container, "manifest.json"),
      materializedRoot: tree.materializedRoot,
    },
  ]) {
    await assert.rejects(verifyRegionData(options), /exactly one/i);
  }
  await assert.rejects(
    verifyRegionData({ sourceRoot: tree.sourceRoot }),
    /materializedRoot is required/i,
  );
});

test("reports symlinks once and never follows them during exact verification", async () => {
  const tree = await fixture();
  const logicalPath = "packages/geoint/region-dist/sample.json";
  const materialized = join(tree.materializedRoot, ...logicalPath.split("/"));
  await rm(materialized);
  await symlink(join(tree.sourceRoot, "region-dist/sample.json"), materialized);

  const result = await verifyRegionData({
    sourceRoot: tree.sourceRoot,
    materializedRoot: tree.materializedRoot,
    exact: true,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.mismatches.unreadable, [logicalPath]);
});

test("reports inaccessible managed directories without treating them as missing", async () => {
  const tree = await fixture();
  const directory = join(tree.materializedRoot, "packages/geoint/region-dist");
  await chmod(directory, 0o000);
  try {
    const result = await verifyRegionData({
      sourceRoot: tree.sourceRoot,
      materializedRoot: tree.materializedRoot,
      exact: true,
    });
    assert.equal(result.ok, false);
    assert.equal(result.mismatches.missing.length, 0);
    assert.ok(
      result.mismatches.unreadable.includes(
        "packages/geoint/region-dist/sample.json",
      ),
    );
    assert.ok(
      result.mismatches.unreadable.includes("packages/geoint/region-dist"),
    );
  } finally {
    await chmod(directory, 0o700);
  }
});
