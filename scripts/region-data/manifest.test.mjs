import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { afterEach, describe, test } from "node:test";

import {
  canonicalJson,
  createManifest,
  deterministicGzip,
  sha256Hex,
  validateManifest,
} from "./manifest.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

const makeTree = async (files) => {
  const root = await mkdtemp(join(tmpdir(), "region-manifest-"));
  temporaryDirectories.push(root);
  await Promise.all([
    mkdir(join(root, "region-dist"), { recursive: true }),
    mkdir(join(root, "region-db"), { recursive: true }),
  ]);
  for (const [relativePath, contents] of Object.entries(files)) {
    const destination = join(root, ...relativePath.split("/"));
    await mkdir(join(destination, ".."), { recursive: true });
    await writeFile(destination, contents);
  }
  return root;
};

const getEntry = (manifest, path) =>
  manifest.entries.find((entry) => entry.path === path);

describe("immutable region-data manifest", () => {
  test("enumerates stable logical paths with binary-safe metadata and groups", async () => {
    const binary = Buffer.from([0, 255, 13, 10, 128, 65]);
    const shared = Buffer.from("shared\n");
    const root = await makeTree({
      "region-db/z.index": shared,
      "region-db/nested/000001.log": binary,
      "region-dist/z.json": shared,
      "region-dist/a.json": Buffer.from("first\n"),
    });

    const manifest = await createManifest({ sourceRoot: root });

    assert.equal(manifest.schemaVersion, 1);
    assert.match(manifest.version, /^sha256-[a-f0-9]{64}$/);
    assert.deepEqual(
      manifest.entries.map(({ path }) => path),
      [
        "packages/geoint/region-db/nested/000001.log",
        "packages/geoint/region-db/z.index",
        "packages/geoint/region-dist/a.json",
        "packages/geoint/region-dist/z.json",
      ],
    );
    const binaryEntry = getEntry(
      manifest,
      "packages/geoint/region-db/nested/000001.log",
    );
    assert.deepEqual(binaryEntry, {
      path: "packages/geoint/region-db/nested/000001.log",
      group: "region-db",
      size: binary.length,
      compressedSize: gzipSync(binary, { level: 9, mtime: 0 }).length,
      sha256: sha256Hex(binary),
      objectKey: `releases/${manifest.version}/objects/${sha256Hex(binary)}.json.gz`,
    });
    assert.equal(
      getEntry(manifest, "packages/geoint/region-dist/a.json").group,
      "region-dist",
    );
  });

  test("reuses one content-addressed object key for duplicate bytes", async () => {
    const root = await makeTree({
      "region-db/sample.index": Buffer.from("same bytes"),
      "region-dist/sample.json": Buffer.from("same bytes"),
    });

    const manifest = await createManifest({ sourceRoot: root });
    const [first, second] = manifest.entries;

    assert.equal(first.sha256, second.sha256);
    assert.equal(first.objectKey, second.objectKey);
    assert.equal(
      first.objectKey,
      `releases/${manifest.version}/objects/${first.sha256}.json.gz`,
    );
  });

  test("derives identical bytes and versions without host paths or timestamps", async () => {
    const files = {
      "region-db/sample.index": Buffer.from("index"),
      "region-dist/sample.json": Buffer.from("json"),
    };
    const firstRoot = await makeTree(files);
    const secondRoot = await makeTree(files);
    await utimes(join(secondRoot, "region-dist/sample.json"), 1, 2);

    const first = await createManifest({ sourceRoot: firstRoot });
    const second = await createManifest({ sourceRoot: secondRoot });
    const versionEntries = first.entries.map(
      ({ path, group, size, compressedSize, sha256 }) => ({
        path,
        group,
        size,
        compressedSize,
        sha256,
      }),
    );

    assert.deepEqual(second, first);
    assert.equal(canonicalJson(second), canonicalJson(first));
    assert.equal(
      first.version,
      `sha256-${sha256Hex(
        canonicalJson({ schemaVersion: 1, entries: versionEntries }),
      )}`,
      "release version excludes the circular objectKey field",
    );

    await writeFile(join(secondRoot, "region-dist/sample.json"), "Json");
    const changed = await createManifest({ sourceRoot: secondRoot });
    assert.notEqual(changed.version, first.version);
  });

  test("uses deterministic gzip bytes with timestamp fields cleared", () => {
    const contents = Buffer.from([0, 1, 2, 253, 254, 255]);

    const first = deterministicGzip(contents);
    const second = deterministicGzip(contents);

    assert.deepEqual(second, first);
    assert.deepEqual([...first.subarray(4, 8)], [0, 0, 0, 0]);
    assert.equal(first[9], 255, "gzip OS metadata is host-neutral");
  });

  test("serializes canonical JSON recursively without whitespace", () => {
    assert.equal(
      canonicalJson({ z: [{ b: 2, a: 1 }], a: { d: 4, c: 3 } }),
      '{"a":{"c":3,"d":4},"z":[{"a":1,"b":2}]}',
    );
  });

  test("validates a generated manifest and rejects unsupported metadata", async () => {
    const root = await makeTree({
      "region-db/sample.index": Buffer.from("index"),
      "region-dist/sample.json": Buffer.from("json"),
    });
    const valid = await createManifest({ sourceRoot: root });
    assert.deepEqual(validateManifest(valid), valid);

    const cases = [
      ["unsupported schema version", (value) => (value.schemaVersion = 2)],
      [
        "unsupported version hash",
        (value) => (value.version = `sha512-${"a".repeat(64)}`),
      ],
      [
        "malformed release version",
        (value) => (value.version = `sha256-${"A".repeat(64)}`),
      ],
      [
        "content-derived version mismatch",
        (value) => (value.version = `sha256-${"0".repeat(64)}`),
      ],
      [
        "malformed entry hash",
        (value) => (value.entries[0].sha256 = "not-a-hash"),
      ],
      ["negative size", (value) => (value.entries[0].size = -1)],
      [
        "fractional compressed size",
        (value) => (value.entries[0].compressedSize = 1.5),
      ],
      [
        "group/path mismatch",
        (value) => (value.entries[0].group = "region-dist"),
      ],
      [
        "malformed object key",
        (value) => (value.entries[0].objectKey = "objects/file"),
      ],
      ["unsorted entries", (value) => value.entries.reverse()],
    ];

    for (const [name, mutate] of cases) {
      const invalid = structuredClone(valid);
      mutate(invalid);
      assert.throws(() => validateManifest(invalid), undefined, name);
    }
  });

  test("rejects paths outside the managed roots, absolute paths, and traversal", async () => {
    const root = await makeTree({
      "region-db/sample.index": Buffer.from("index"),
      "region-dist/sample.json": Buffer.from("json"),
    });
    const valid = await createManifest({ sourceRoot: root });
    const invalidPaths = [
      "/packages/geoint/region-db/sample.index",
      "../packages/geoint/region-db/sample.index",
      "packages/geoint/region-db/../region-dist/sample.json",
      "packages/geoint/region-dataset/sample.json",
      "packages/geoint/region-dist\\sample.json",
    ];

    for (const path of invalidPaths) {
      const invalid = structuredClone(valid);
      invalid.entries[0].path = path;
      assert.throws(() => validateManifest(invalid), undefined, path);
    }
  });

  test("rejects duplicate logical paths", async () => {
    const root = await makeTree({
      "region-db/sample.index": Buffer.from("index"),
      "region-dist/sample.json": Buffer.from("json"),
    });
    const valid = await createManifest({ sourceRoot: root });
    const invalid = structuredClone(valid);
    invalid.entries[1].path = invalid.entries[0].path;
    invalid.entries[1].group = invalid.entries[0].group;

    assert.throws(() => validateManifest(invalid), /duplicate/i);
  });

  test("rejects a symlink or non-directory sourceRoot before enumeration", async () => {
    const targetRoot = await makeTree({
      "region-db/sample.index": Buffer.from("index"),
      "region-dist/sample.json": Buffer.from("json"),
    });
    const linkContainer = await mkdtemp(
      join(tmpdir(), "region-manifest-link-"),
    );
    temporaryDirectories.push(linkContainer);
    const linkedRoot = join(linkContainer, "geoint");
    await symlink(targetRoot, linkedRoot, "dir");

    await assert.rejects(
      createManifest({ sourceRoot: linkedRoot }),
      /sourceRoot.*symlink/i,
    );

    const fileContainer = await mkdtemp(
      join(tmpdir(), "region-manifest-file-"),
    );
    temporaryDirectories.push(fileContainer);
    const fileRoot = join(fileContainer, "geoint");
    await writeFile(fileRoot, "not a directory");

    await assert.rejects(
      createManifest({ sourceRoot: fileRoot }),
      /sourceRoot.*directory/i,
    );
  });

  test("rejects managed-root and nested-directory symlinks", async () => {
    const groupLinkRoot = await makeTree({
      "region-db/sample.index": Buffer.from("index"),
    });
    await rm(join(groupLinkRoot, "region-dist"), { recursive: true });
    await symlink(
      join(groupLinkRoot, "region-db"),
      join(groupLinkRoot, "region-dist"),
      "dir",
    );
    await assert.rejects(
      createManifest({ sourceRoot: groupLinkRoot }),
      /region-dist.*directory|symlink/i,
    );

    const nestedLinkRoot = await makeTree({
      "region-db/sample.index": Buffer.from("index"),
      "region-dist/sample.json": Buffer.from("json"),
    });
    await symlink(
      join(nestedLinkRoot, "region-db"),
      join(nestedLinkRoot, "region-dist/nested"),
      "dir",
    );
    await assert.rejects(
      createManifest({ sourceRoot: nestedLinkRoot }),
      /nested.*symlink/i,
    );
  });

  test("rejects symlinks and non-regular filesystem entries", async () => {
    const symlinkRoot = await makeTree({
      "region-db/sample.index": Buffer.from("index"),
      "region-dist/sample.json": Buffer.from("json"),
    });
    await symlink(
      join(symlinkRoot, "region-db/sample.index"),
      join(symlinkRoot, "region-dist/link.json"),
    );
    await assert.rejects(
      createManifest({ sourceRoot: symlinkRoot }),
      /regular file|symlink/i,
    );

    const socketRoot = await makeTree({
      "region-db/sample.index": Buffer.from("index"),
      "region-dist/sample.json": Buffer.from("json"),
    });
    const socketPath = join(socketRoot, "region-db/service.sock");
    const server = createServer();
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(socketPath, resolve);
    });
    try {
      await assert.rejects(
        createManifest({ sourceRoot: socketRoot }),
        /regular file|socket/i,
      );
    } finally {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  test("builds the committed fixtures into the versioned document shape", async () => {
    const fixtureRoot = new URL("./fixtures/", import.meta.url);
    const manifest = await createManifest({ sourceRoot: fixtureRoot });

    assert.equal(manifest.entries.length, 3);
    assert.deepEqual(validateManifest(manifest), manifest);
    assert.ok(
      manifest.entries.every((entry) =>
        entry.objectKey.startsWith(`releases/${manifest.version}/objects/`),
      ),
    );
    const [duplicateA, duplicateB] = [
      getEntry(manifest, "packages/geoint/region-dist/sample.json"),
      getEntry(manifest, "packages/geoint/region-db/sample.index"),
    ];
    assert.equal(duplicateA.objectKey, duplicateB.objectKey);
    assert.equal(
      await readFile(
        new URL("./fixtures/region-dist/sample.json", import.meta.url),
        "utf8",
      ),
      await readFile(
        new URL("./fixtures/region-db/sample.index", import.meta.url),
        "utf8",
      ),
    );
  });

  test("keeps nested region-data contracts mandatory in the root script suite", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../../package.json", import.meta.url), "utf8"),
    );

    assert.equal(
      packageJson.scripts["scripts:test"],
      "node --test scripts/*.test.mjs scripts/region-data/*.test.mjs",
    );
  });
});
