import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalJson, createManifest } from "./manifest.mjs";
import { formatVerificationResult, verifyRegionData } from "./verify.mjs";

const temporaryDirectories = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

const createTrees = async () => {
  const container = await mkdtemp(join(tmpdir(), "region-verify-"));
  temporaryDirectories.push(container);
  const sourceRoot = join(container, "source");
  const materializedRoot = join(container, "materialized");
  const files = {
    "region-db/sample.index": Buffer.from("database"),
    "region-db/sample/000001.log": Buffer.from([0, 255, 1, 2]),
    "region-dist/sample.json": Buffer.from('{"name":"sample"}'),
  };
  for (const group of ["region-dist", "region-db"]) {
    await mkdir(join(sourceRoot, group), { recursive: true });
    await mkdir(join(materializedRoot, "packages/geoint", group), {
      recursive: true,
    });
  }
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
  return { files, materializedRoot, sourceRoot };
};

test("compares source and materialized trees by path, group, size, and hash", async () => {
  const fixture = await createTrees();
  const valid = await verifyRegionData({
    sourceRoot: fixture.sourceRoot,
    materializedRoot: fixture.materializedRoot,
    exact: true,
  });
  assert.equal(valid.ok, true);
  assert.match(valid.version, /^sha256-[a-f0-9]{64}$/);
  assert.equal(valid.entryCount, 3);
  assert.deepEqual(valid.groupCounts, { "region-dist": 1, "region-db": 2 });
  assert.equal(
    valid.bytes,
    Object.values(fixture.files).reduce((sum, bytes) => sum + bytes.length, 0),
  );
  assert.deepEqual(valid.mismatches, {
    missing: [],
    extra: [],
    changed: [],
    unreadable: [],
  });

  const missingPath = join(
    fixture.materializedRoot,
    "packages/geoint/region-db/sample.index",
  );
  await rm(missingPath);
  const missing = await verifyRegionData({
    sourceRoot: fixture.sourceRoot,
    materializedRoot: fixture.materializedRoot,
    exact: true,
  });
  assert.deepEqual(missing.mismatches.missing, [
    "packages/geoint/region-db/sample.index",
  ]);
  await writeFile(missingPath, fixture.files["region-db/sample.index"]);

  const changedPath = join(
    fixture.materializedRoot,
    "packages/geoint/region-dist/sample.json",
  );
  await writeFile(changedPath, "changed");
  const changed = await verifyRegionData({
    sourceRoot: fixture.sourceRoot,
    materializedRoot: fixture.materializedRoot,
    exact: true,
  });
  assert.deepEqual(changed.mismatches.changed, [
    "packages/geoint/region-dist/sample.json",
  ]);
  await writeFile(changedPath, fixture.files["region-dist/sample.json"]);

  const extraPath = join(
    fixture.materializedRoot,
    "packages/geoint/region-dist/extra.json",
  );
  await writeFile(extraPath, "extra");
  const nonExact = await verifyRegionData({
    sourceRoot: fixture.sourceRoot,
    materializedRoot: fixture.materializedRoot,
  });
  assert.equal(nonExact.ok, true);
  const exact = await verifyRegionData({
    sourceRoot: fixture.sourceRoot,
    materializedRoot: fixture.materializedRoot,
    exact: true,
  });
  assert.deepEqual(exact.mismatches.extra, [
    "packages/geoint/region-dist/extra.json",
  ]);
});

test("compares a canonical manifest with a materialized tree", async () => {
  const fixture = await createTrees();
  const manifest = await createManifest({ sourceRoot: fixture.sourceRoot });
  const manifestPath = join(fixture.sourceRoot, "manifest.json");
  await writeFile(manifestPath, canonicalJson(manifest));

  const result = await verifyRegionData({
    manifestPath,
    materializedRoot: fixture.materializedRoot,
    exact: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.version, manifest.version);
  assert.equal(result.entryCount, manifest.entries.length);
  assert.deepEqual(result.mismatches, {
    missing: [],
    extra: [],
    changed: [],
    unreadable: [],
  });
});

test("reports read failures without formatting paths or file contents", async () => {
  const fixture = await createTrees();
  const unreadablePath = join(
    fixture.materializedRoot,
    "packages/geoint/region-dist/sample.json",
  );
  await chmod(unreadablePath, 0o000);

  const result = await verifyRegionData({
    sourceRoot: fixture.sourceRoot,
    materializedRoot: fixture.materializedRoot,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.mismatches.unreadable, [
    "packages/geoint/region-dist/sample.json",
  ]);
  const output = formatVerificationResult({
    ...result,
    secret: "PRIVATE-CONTENT-SENTINEL",
  });
  assert.equal(
    output,
    `verified ok=0 version=${result.version} entries=3 region-dist=1 region-db=2 bytes=${result.bytes} missing=0 extra=0 changed=0 unreadable=1`,
  );
  assert.equal(output.includes("sample.json"), false);
  assert.equal(output.includes("PRIVATE-CONTENT-SENTINEL"), false);
});

const runCli = (arguments_) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(new URL("../verify-region-data.mjs", import.meta.url)),
        ...arguments_,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stderr, stdout }));
  });

test("runs the explicit verifier CLI and records the root command", async () => {
  const fixture = await createTrees();
  const result = await runCli([
    "--source",
    fixture.sourceRoot,
    "--materialized",
    fixture.materializedRoot,
    "--exact",
  ]);

  assert.equal(result.code, 0, result.stderr);
  assert.match(
    result.stdout,
    /^verified ok=1 version=sha256-[a-f0-9]{64} entries=3 /,
  );
  assert.equal(result.stderr, "");

  const packageJson = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url), "utf8"),
  );
  assert.equal(
    packageJson.scripts["region-data:verify"],
    "node scripts/verify-region-data.mjs",
  );
});
