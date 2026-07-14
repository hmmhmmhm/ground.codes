import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  rename,
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

const makeTemporaryDirectory = async (prefix = "region-manifest-") => {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
};

const makeTree = async (files) => {
  const root = await makeTemporaryDirectory();
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

const makeBasicTree = () =>
  makeTree({
    "region-db/sample.index": Buffer.from("index"),
    "region-dist/sample.json": Buffer.from("json"),
  });
const getEntry = (manifest, path) =>
  manifest.entries.find((entry) => entry.path === path);
const releaseEntries = (manifest) =>
  manifest.entries.map(({ path, group, size, compressedSize, sha256 }) => ({
    path,
    group,
    size,
    compressedSize,
    sha256,
  }));

const refreshReleaseIdentity = (manifest) => {
  manifest.version = `sha256-${sha256Hex(
    canonicalJson({ schemaVersion: 1, entries: releaseEntries(manifest) }),
  )}`;
  for (const entry of manifest.entries) {
    entry.objectKey = `releases/${manifest.version}/objects/${entry.sha256}.json.gz`;
  }
};

const compressorVector = () => {
  let input;
  let x = 0x12345678;
  for (let n = 0; n <= 3; n += 1) {
    input = Buffer.alloc((n * 7919) % 65537);
    for (let index = 0; index < input.length; index += 1) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      x >>>= 0;
      input[index] = (x + (index % 17 === 0 ? n : 0)) & 255;
    }
  }
  return input;
};

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

    assert.deepEqual(second, first);
    assert.equal(
      first.version,
      `sha256-${sha256Hex(
        canonicalJson({ schemaVersion: 1, entries: releaseEntries(first) }),
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

  test(
    "pins the Node 22 compressor to the reviewed golden vector",
    { skip: process.versions.node.split(".")[0] !== "22" },
    () => {
      const input = compressorVector();
      const compressed = deterministicGzip(input);
      assert.equal(input.length, 23757);
      assert.equal(
        sha256Hex(input),
        "a8f45e88ab5d8f7d6a500500fbd27e8ecbbed4d7bc0f3dec76d98be7bafd778b",
      );
      assert.equal(compressed.length, 23785);
      assert.equal(
        sha256Hex(compressed),
        "941a4bc214aa7c64e7774aef050f4e4fc0ed5a45220ebbcccf54a4b00d5314ee",
      );
    },
  );

  test(
    "rejects the observed Node 25 and zlib 1.2 compressor runtime",
    { skip: process.versions.node.split(".")[0] === "22" },
    () => {
      assert.equal(process.versions.node, "25.9.0");
      assert.equal(process.versions.zlib, "1.2.12");
      assert.throws(
        () => deterministicGzip(Buffer.from("unsupported runtime")),
        /requires Node 22/i,
      );
    },
  );

  test("serializes canonical JSON recursively without whitespace", () => {
    assert.equal(
      canonicalJson({ z: [{ b: 2, a: 1 }], a: { d: 4, c: 3 } }),
      '{"a":{"c":3,"d":4},"z":[{"a":1,"b":2}]}',
    );
  });

  test("validates a generated manifest and rejects unsupported metadata", async () => {
    const root = await makeBasicTree();
    const valid = await createManifest({ sourceRoot: root });
    assert.deepEqual(validateManifest(valid), valid);

    const mutations = [
      (value) => (value.schemaVersion = 2),
      (value) => (value.version = `sha512-${"a".repeat(64)}`),
      (value) => (value.version = `sha256-${"A".repeat(64)}`),
      (value) => (value.version = `sha256-${"0".repeat(64)}`),
      (value) => (value.entries[0].sha256 = "not-a-hash"),
      (value) => (value.entries[0].size = -1),
      (value) => (value.entries[0].compressedSize = 1.5),
      (value) => (value.entries[0].group = "region-dist"),
      (value) => (value.entries[0].objectKey = "objects/file"),
      (value) => value.entries.reverse(),
    ];

    for (const mutate of mutations) {
      const invalid = structuredClone(valid);
      mutate(invalid);
      assert.throws(() => validateManifest(invalid));
    }
  });

  test("rejects paths outside the managed roots, absolute paths, and traversal", async () => {
    const root = await makeBasicTree();
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
    const root = await makeBasicTree();
    const valid = await createManifest({ sourceRoot: root });
    const invalid = structuredClone(valid);
    invalid.entries[1].path = invalid.entries[0].path;
    invalid.entries[1].group = invalid.entries[0].group;

    assert.throws(() => validateManifest(invalid), /duplicate/i);
  });

  test("rejects conflicting metadata for one content-addressed object", async () => {
    const root = await makeTree({
      "region-db/sample.index": Buffer.from("same bytes"),
      "region-dist/sample.json": Buffer.from("same bytes"),
    });
    const hostile = await createManifest({ sourceRoot: root });
    hostile.entries[1].size += 1;
    hostile.entries[1].compressedSize += 1;
    refreshReleaseIdentity(hostile);

    assert.throws(() => validateManifest(hostile), /conflicting.*metadata/i);
  });

  test("rejects a regular file replaced by an external symlink after lstat", async () => {
    const root = await makeTree({
      "region-db/sample.index": Buffer.from("index"),
      "region-dist/sample.json": Buffer.from("inside"),
    });
    const outsideRoot = await makeTemporaryDirectory(
      "region-manifest-outside-",
    );
    const outsideFile = join(outsideRoot, "outside.json");
    await writeFile(outsideFile, "outside");
    const victim = join(root, "region-dist/sample.json");
    await assert.rejects(
      createManifest(
        { sourceRoot: root },
        {
          beforeFileOpen: async ({ logicalPath }) => {
            if (logicalPath !== "packages/geoint/region-dist/sample.json")
              return;
            await rm(victim);
            await symlink(outsideFile, victim);
          },
        },
      ),
      /changed|containment|regular file|symlink/i,
    );
  });

  test("rejects sourceRoot replacement after directory enumeration", async () => {
    const root = await makeTree({
      "region-db/sample.index": Buffer.from("inside-index"),
      "region-dist/sample.json": Buffer.from("inside-json"),
    });
    const replacementRoot = await makeTree({
      "region-db/sample.index": Buffer.from("outside-index"),
      "region-dist/sample.json": Buffer.from("outside-json"),
    });
    const preservedRoot = `${root}-preserved`;
    temporaryDirectories.push(preservedRoot);
    await assert.rejects(
      createManifest(
        { sourceRoot: root },
        {
          beforeFileOpen: async ({ logicalPath }) => {
            if (logicalPath !== "packages/geoint/region-dist/sample.json")
              return;
            await rename(root, preservedRoot);
            await symlink(replacementRoot, root, "dir");
          },
        },
      ),
      /changed|containment|sourceRoot|symlink/i,
    );
  });

  test("rejects a symlink or non-directory sourceRoot before enumeration", async () => {
    const targetRoot = await makeBasicTree();
    const linkContainer = await makeTemporaryDirectory("region-manifest-link-");
    const linkedRoot = join(linkContainer, "geoint");
    await symlink(targetRoot, linkedRoot, "dir");
    await assert.rejects(
      createManifest({ sourceRoot: linkedRoot }),
      /sourceRoot.*symlink/i,
    );

    const fileContainer = await makeTemporaryDirectory("region-manifest-file-");
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
    const nestedLinkRoot = await makeBasicTree();
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
    const symlinkRoot = await makeBasicTree();
    await symlink(
      join(symlinkRoot, "region-db/sample.index"),
      join(symlinkRoot, "region-dist/link.json"),
    );
    await assert.rejects(
      createManifest({ sourceRoot: symlinkRoot }),
      /regular file|symlink/i,
    );
    const socketRoot = await makeBasicTree();
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
    const [duplicateA, duplicateB] = [
      getEntry(manifest, "packages/geoint/region-dist/sample.json"),
      getEntry(manifest, "packages/geoint/region-db/sample.index"),
    ];
    assert.equal(duplicateA.objectKey, duplicateB.objectKey);
  });

  test("keeps nested region-data contracts mandatory in the root script suite", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../../package.json", import.meta.url), "utf8"),
    );
    assert.equal(
      packageJson.scripts["scripts:test"],
      "node --test scripts/*.test.mjs scripts/region-data/*.test.mjs",
    );
    assert.equal(
      (await readFile(new URL("../../.nvmrc", import.meta.url), "utf8")).trim(),
      "22",
    );
    assert.match(
      await readFile(
        new URL("../../.github/workflows/ci.yml", import.meta.url),
        "utf8",
      ),
      /node-version:\s*["']22["']/,
    );
  });
});
