import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  createManifest,
  deterministicGzip,
  sha256Hex,
} from "./manifest.mjs";
import * as releaseGenerator from "./generate-release.mjs";
import { removeWritableTree } from "./test-cleanup.mjs";

const { generateRelease } = releaseGenerator;

const temporaryDirectories = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => removeWritableTree(directory)),
  );
});

const temporaryDirectory = async () => {
  const directory = await mkdtemp(join(tmpdir(), "region-release-"));
  temporaryDirectories.push(directory);
  return directory;
};

const makeSource = async (root, files) => {
  const sourceRoot = join(root, "source");
  await Promise.all(
    ["region-dist", "region-db"].map((group) =>
      mkdir(join(sourceRoot, group), { recursive: true }),
    ),
  );
  for (const [relativePath, contents] of Object.entries(files)) {
    const destination = join(sourceRoot, ...relativePath.split("/"));
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, contents);
  }
  return sourceRoot;
};

const releasePaths = (root, version) => ({
  release: join(root, "staging", "releases", version),
  manifest: join(root, "staging", "releases", version, "manifest.json"),
  pointer: join(root, "pointer", "region-data-release.json"),
});

const collectRelease = async ({ root, version }) => {
  const paths = releasePaths(root, version);
  const manifestBytes = await readFile(paths.manifest);
  const manifest = JSON.parse(manifestBytes);
  const objectNames = await readdir(join(paths.release, "objects"));
  const objects = new Map(
    await Promise.all(
      objectNames
        .sort()
        .map(async (name) => [
          name,
          await readFile(join(paths.release, "objects", name)),
        ]),
    ),
  );
  return { manifest, manifestBytes, objects };
};

const generate = (root, sourceRoot) =>
  generateRelease({
    sourceRoot,
    stagingRoot: join(root, "staging"),
    pointerPath: releasePaths(root, "unused").pointer,
  });

const runCli = (arguments_) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(
          new URL("../generate-region-data-release.mjs", import.meta.url),
        ),
        ...arguments_,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stdout, stderr }));
  });

describe("deterministic region-data release generation", () => {
  test("exports only the minimal programmatic generator API", () => {
    assert.deepEqual(Object.keys(releaseGenerator), ["generateRelease"]);
  });

  test("repeats exact manifest and object bytes while writing one object per hash", async () => {
    const root = await temporaryDirectory();
    const shared = Buffer.from([0, 255, 13, 10, 65]);
    const sourceRoot = await makeSource(root, {
      "region-db/a.index": shared,
      "region-db/nested/000001.log": Buffer.from("unique-db"),
      "region-dist/a.json": shared,
    });

    const firstResult = await generate(root, sourceRoot);
    const first = await collectRelease({ root, version: firstResult.version });
    const firstPointer = await readFile(releasePaths(root, "unused").pointer);
    const secondResult = await generate(root, sourceRoot);
    const second = await collectRelease({
      root,
      version: secondResult.version,
    });
    const secondPointer = await readFile(releasePaths(root, "unused").pointer);

    assert.equal(secondResult.version, firstResult.version);
    assert.equal(firstResult.createdObjects, 2);
    assert.equal(
      secondResult.createdObjects,
      0,
      "an exact rerun performs no object writes",
    );
    assert.deepEqual(second.manifestBytes, first.manifestBytes);
    assert.deepEqual(second.objects, first.objects);
    assert.deepEqual(secondPointer, firstPointer);
    assert.equal(first.objects.size, 2, "duplicate bytes share one object");
    assert.equal(first.manifest.entries.length, 3);
    assert.deepEqual(
      first.manifestBytes,
      Buffer.from(canonicalJson(first.manifest)),
    );
    assert.deepEqual(
      firstPointer,
      Buffer.from(
        canonicalJson({
          schemaVersion: 1,
          version: first.manifest.version,
          manifestSha256: sha256Hex(first.manifestBytes),
        }),
      ),
    );
    for (const contents of [shared, Buffer.from("unique-db")]) {
      assert.deepEqual(
        first.objects.get(`${sha256Hex(contents)}.json.gz`),
        deterministicGzip(contents),
      );
    }
  });

  test("changes only the edited content hash while release-prefixed keys follow the new version", async () => {
    const root = await temporaryDirectory();
    const originalBytes = Buffer.from("before");
    const changedBytes = Buffer.from(originalBytes);
    changedBytes[2] ^= 0x01;
    const sourceRoot = await makeSource(root, {
      "region-db/a.index": Buffer.from("stable-db"),
      "region-dist/a.json": originalBytes,
    });

    const beforeResult = await generate(root, sourceRoot);
    const before = await collectRelease({
      root,
      version: beforeResult.version,
    });
    const byteDifferenceCount = Array.from(
      { length: Math.max(originalBytes.length, changedBytes.length) },
      (_, index) => originalBytes[index] !== changedBytes[index],
    ).filter(Boolean).length;
    assert.equal(
      byteDifferenceCount,
      1,
      "the fixture changes exactly one byte",
    );
    assert.equal(changedBytes.length, originalBytes.length);
    await writeFile(join(sourceRoot, "region-dist", "a.json"), changedBytes);
    const afterResult = await generate(root, sourceRoot);
    const after = await collectRelease({ root, version: afterResult.version });

    assert.notEqual(afterResult.version, beforeResult.version);
    const beforeByPath = new Map(
      before.manifest.entries.map((entry) => [entry.path, entry]),
    );
    const afterByPath = new Map(
      after.manifest.entries.map((entry) => [entry.path, entry]),
    );
    assert.equal(
      afterByPath.get("packages/geoint/region-db/a.index").sha256,
      beforeByPath.get("packages/geoint/region-db/a.index").sha256,
    );
    assert.notEqual(
      afterByPath.get("packages/geoint/region-dist/a.json").sha256,
      beforeByPath.get("packages/geoint/region-dist/a.json").sha256,
    );
    const beforeHashes = new Set(
      before.manifest.entries.map(({ sha256 }) => sha256),
    );
    const afterHashes = new Set(
      after.manifest.entries.map(({ sha256 }) => sha256),
    );
    assert.equal(
      [...beforeHashes].filter((hash) => !afterHashes.has(hash)).length,
      1,
    );
    assert.equal(
      [...afterHashes].filter((hash) => !beforeHashes.has(hash)).length,
      1,
    );
    assert.ok(
      after.manifest.entries.every(
        (entry) =>
          entry.objectKey.startsWith(`releases/${afterResult.version}/`) &&
          entry.objectKey !== beforeByPath.get(entry.path).objectKey,
      ),
      "the Task 1 contract release-prefixes every object key",
    );
  });

  test("fails closed on a conflicting object before writing the manifest", async () => {
    const root = await temporaryDirectory();
    const sourceRoot = await makeSource(root, {
      "region-db/a.index": Buffer.from("db"),
      "region-dist/a.json": Buffer.from("dist"),
    });
    const manifest = await createManifest({ sourceRoot });
    const paths = releasePaths(root, manifest.version);
    const firstObject = join(root, "staging", manifest.entries[0].objectKey);
    await mkdir(dirname(firstObject), { recursive: true });
    await writeFile(firstObject, "conflict");

    await assert.rejects(
      generate(root, sourceRoot),
      /sealed|immutable release has an extra, missing, or invalid entry/i,
    );
    await assert.rejects(readFile(paths.manifest), /ENOENT/);
    await assert.rejects(readFile(paths.pointer), /ENOENT/);
  });

  test("rejects a pointer overlapping the release manifest before any write", async () => {
    const root = await temporaryDirectory();
    const sourceRoot = await makeSource(root, {
      "region-db/a.index": Buffer.from("db"),
      "region-dist/a.json": Buffer.from("dist"),
    });
    const stagingRoot = join(root, "staging");
    const manifest = await createManifest({ sourceRoot });
    const manifestPointerPath = join(
      stagingRoot,
      "releases",
      manifest.version,
      "manifest.json",
    );

    for (const pointerPath of [stagingRoot, manifestPointerPath]) {
      await assert.rejects(
        generateRelease({ sourceRoot, stagingRoot, pointerPath }),
        /release pointer must not overlap the staging root or a release artifact/i,
      );
      await assert.rejects(lstat(stagingRoot), /ENOENT/);
    }
  });

  test("treats an existing partial release as immutable instead of repairing it", async () => {
    const root = await temporaryDirectory();
    const sourceRoot = await makeSource(root, {
      "region-db/a.index": Buffer.from("db"),
      "region-dist/a.json": Buffer.from("dist"),
    });
    const result = await generate(root, sourceRoot);
    const paths = releasePaths(root, result.version);
    const manifest = JSON.parse(await readFile(paths.manifest, "utf8"));
    const missingObject = join(root, "staging", manifest.entries[0].objectKey);
    await chmod(dirname(missingObject), 0o700);
    await Promise.all([rm(missingObject), rm(paths.pointer)]);
    await chmod(dirname(missingObject), 0o555);

    await assert.rejects(
      generate(root, sourceRoot),
      /object set has an extra, missing, or non-regular entry/i,
    );
    await assert.rejects(lstat(missingObject), /ENOENT/);
    await assert.rejects(lstat(paths.pointer), /ENOENT/);
  });

  test("rejects symlink staging roots and non-regular immutable artifacts", async () => {
    const root = await temporaryDirectory();
    const sourceRoot = await makeSource(root, {
      "region-db/a.index": Buffer.from("db"),
      "region-dist/a.json": Buffer.from("dist"),
    });
    const elsewhere = join(root, "elsewhere");
    await mkdir(elsewhere);
    await symlink(elsewhere, join(root, "staging"));
    await assert.rejects(generate(root, sourceRoot), /staging.*symlink/i);

    await rm(join(root, "staging"));
    const manifest = await createManifest({ sourceRoot });
    const objectPath = join(root, "staging", manifest.entries[0].objectKey);
    await mkdir(objectPath, { recursive: true });
    await assert.rejects(
      generate(root, sourceRoot),
      /sealed|immutable release has an extra, missing, or invalid entry/i,
    );
    assert.equal((await lstat(objectPath)).isDirectory(), true);
    const paths = releasePaths(root, manifest.version);
    await assert.rejects(readFile(paths.manifest), /ENOENT/);
    await assert.rejects(readFile(paths.pointer), /ENOENT/);
  });

  test("does not follow a nested staging symlink outside the staging root", async () => {
    const root = await temporaryDirectory();
    const sourceRoot = await makeSource(root, {
      "region-db/a.index": Buffer.from("db"),
      "region-dist/a.json": Buffer.from("dist"),
    });
    const stagingRoot = join(root, "staging");
    const outside = join(root, "outside");
    await Promise.all([mkdir(stagingRoot), mkdir(outside)]);
    await symlink(outside, join(stagingRoot, "releases"));

    await assert.rejects(
      generate(root, sourceRoot),
      /releases is not a verified directory/i,
    );
    assert.deepEqual(await readdir(outside), []);
  });

  test("accepts only the three explicit CLI flags and records the approved root command", async () => {
    const root = await temporaryDirectory();
    const sourceRoot = await makeSource(root, {
      "region-db/a.index": Buffer.from("db"),
      "region-dist/a.json": Buffer.from("dist"),
    });
    const stagingRoot = join(root, "staging");
    const pointerPath = join(root, "pointer.json");
    const validArguments = [
      "--source",
      sourceRoot,
      "--staging",
      stagingRoot,
      "--pointer-out",
      pointerPath,
    ];

    const valid = await runCli(validArguments);
    assert.equal(valid.code, 0, valid.stderr);
    assert.match(valid.stdout, /^generated sha256-[a-f0-9]{64} /);
    assert.equal(
      JSON.parse(await readFile(pointerPath, "utf8")).schemaVersion,
      1,
    );

    for (const invalidArguments of [
      [...validArguments, "positional"],
      [...validArguments, "--unknown", "value"],
      [...validArguments, "--source", sourceRoot],
      ["--source", sourceRoot, "--staging", stagingRoot],
      ["--source", "--staging", stagingRoot, "--pointer-out", pointerPath],
    ]) {
      const result = await runCli(invalidArguments);
      assert.notEqual(result.code, 0, invalidArguments.join(" "));
      assert.match(result.stderr, /usage:|argument/i);
    }

    const packageJson = JSON.parse(
      await readFile(new URL("../../package.json", import.meta.url), "utf8"),
    );
    assert.equal(
      packageJson.scripts["region-data:generate"],
      "node scripts/generate-region-data-release.mjs --source packages/geoint --staging .region-data-staging --pointer-out packages/geoint/region-data-release.json",
    );
    assert.match(
      await readFile(new URL("../../.gitignore", import.meta.url), "utf8"),
      /^\.region-data-staging\/$/m,
    );
  });
});
