import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, test } from "node:test";

import {
  canonicalJson,
  createManifest,
  sha256Hex,
} from "../../../scripts/region-data/manifest.mjs";

const execFile = promisify(execFileCallback);
const detectorPath = resolve(
  "apps/api-ground-codes/scripts/list-changed-region-datasets.mjs",
);
const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

const git = async (root, ...arguments_) =>
  execFile("git", arguments_, { cwd: root, encoding: "utf8" });

const releaseFixture = async (root, name, datasets) => {
  const sourceRoot = join(root, `source-${name}`);
  await mkdir(join(sourceRoot, "region-dist"), { recursive: true });
  await mkdir(join(sourceRoot, "region-db"), { recursive: true });
  await writeFile(join(sourceRoot, "region-db", "fixture.index"), "index");
  await Promise.all(
    Object.entries(datasets).map(async ([datasetName, contents]) => {
      const datasetPath = join(
        sourceRoot,
        "region-dist",
        `${datasetName}.json`,
      );
      await mkdir(dirname(datasetPath), { recursive: true });
      await writeFile(datasetPath, contents);
    }),
  );
  const manifest = await createManifest({ sourceRoot });
  const bytes = Buffer.from(canonicalJson(manifest));
  return {
    bytes,
    manifest,
    pointer: {
      manifestSha256: sha256Hex(bytes),
      schemaVersion: 1,
      version: manifest.version,
    },
  };
};

const commitPointer = async (root, pointer, message) => {
  const pointerPath = join(root, "packages/geoint/region-data-release.json");
  await mkdir(join(root, "packages/geoint"), { recursive: true });
  await writeFile(pointerPath, canonicalJson(pointer));
  await git(root, "add", "packages/geoint/region-data-release.json");
  await git(root, "commit", "-q", "-m", message);
  return (await git(root, "rev-parse", "HEAD")).stdout.trim();
};

const repositoryFixture = async () => {
  const root = await mkdtemp(join(tmpdir(), "region-dataset-detector-"));
  temporaryRoots.push(root);
  await git(root, "init", "-q");
  await git(root, "config", "user.name", "Region Data Test");
  await git(root, "config", "user.email", "region-data@example.test");
  return root;
};

const serveReleases = async (releases) => {
  const server = createServer((request, response) => {
    const match = request.url?.match(
      /^\/releases\/(sha256-[a-f0-9]{64})\/manifest\.json$/,
    );
    const bytes = match ? releases.get(match[1]) : undefined;
    if (!bytes) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "content-length": String(bytes.length),
      "content-type": "application/json",
    });
    response.end(bytes);
  });
  await new Promise((resolveListen) =>
    server.listen(0, "127.0.0.1", resolveListen),
  );
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
  };
};

const runDetector = (root, baseRef, headRef, baseUrl) =>
  execFile(process.execPath, [detectorPath, baseRef, headRef], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, REGION_DATA_BASE_URL: baseUrl },
  });

describe("release-manifest region dataset detection", () => {
  test("reports added, removed, and hash-changed region-dist datasets", async () => {
    const root = await repositoryFixture();
    const previous = await releaseFixture(root, "previous", {
      changed: "old",
      removed: "removed",
      stable: "stable",
    });
    const current = await releaseFixture(root, "current", {
      added: "added",
      changed: "new",
      stable: "stable",
    });
    const baseRef = await commitPointer(root, previous.pointer, "previous");
    const headRef = await commitPointer(root, current.pointer, "current");
    const server = await serveReleases(
      new Map([
        [previous.manifest.version, previous.bytes],
        [current.manifest.version, current.bytes],
      ]),
    );
    try {
      const result = await runDetector(root, baseRef, headRef, server.baseUrl);
      assert.equal(result.stdout.trim(), "added,changed,removed");
    } finally {
      await server.close();
    }
  });

  test("returns empty without fetching when the release pointer is unchanged", async () => {
    const root = await repositoryFixture();
    const release = await releaseFixture(root, "same", { stable: "stable" });
    const baseRef = await commitPointer(root, release.pointer, "base");
    await writeFile(join(root, "unrelated.txt"), "unrelated");
    await git(root, "add", "unrelated.txt");
    await git(root, "commit", "-q", "-m", "unrelated");
    const headRef = (await git(root, "rev-parse", "HEAD")).stdout.trim();

    const result = await runDetector(
      root,
      baseRef,
      headRef,
      "http://127.0.0.1:1",
    );
    assert.equal(result.stdout, "\n");
  });

  test("fails closed when the previous release manifest is unavailable", async () => {
    const root = await repositoryFixture();
    const previous = await releaseFixture(root, "missing", { old: "old" });
    const current = await releaseFixture(root, "available", { next: "next" });
    const baseRef = await commitPointer(root, previous.pointer, "previous");
    const headRef = await commitPointer(root, current.pointer, "current");
    const server = await serveReleases(
      new Map([[current.manifest.version, current.bytes]]),
    );
    try {
      await assert.rejects(
        runDetector(root, baseRef, headRef, server.baseUrl),
        (error) => {
          assert.notEqual(error.code, 0);
          assert.match(error.stderr, /previous release manifest/i);
          return true;
        },
      );
    } finally {
      await server.close();
    }
  });

  test("uses tracked Git data for the one-time pointer introduction", async () => {
    const root = await repositoryFixture();
    const trackedDataset = join(
      root,
      "packages/geoint/region-dist/transition.json",
    );
    await mkdir(dirname(trackedDataset), { recursive: true });
    await writeFile(trackedDataset, "old");
    await git(root, "add", "packages/geoint/region-dist/transition.json");
    await git(root, "commit", "-q", "-m", "git-backed data");
    const baseRef = (await git(root, "rev-parse", "HEAD")).stdout.trim();

    const current = await releaseFixture(root, "transition", {
      transition: "new",
    });
    await writeFile(trackedDataset, "new");
    await git(root, "add", "packages/geoint/region-dist/transition.json");
    const headRef = await commitPointer(root, current.pointer, "add pointer");

    const result = await runDetector(
      root,
      baseRef,
      headRef,
      "http://127.0.0.1:1",
    );
    assert.equal(result.stdout.trim(), "transition");
  });

  test("fails closed on a region-dist entry the importer cannot name", async () => {
    const root = await repositoryFixture();
    const previous = await releaseFixture(root, "flat", { stable: "same" });
    const current = await releaseFixture(root, "nested", {
      "nested/unsupported": "unsupported",
      stable: "same",
    });
    const baseRef = await commitPointer(root, previous.pointer, "previous");
    const headRef = await commitPointer(root, current.pointer, "current");
    const server = await serveReleases(
      new Map([
        [previous.manifest.version, previous.bytes],
        [current.manifest.version, current.bytes],
      ]),
    );
    try {
      await assert.rejects(
        runDetector(root, baseRef, headRef, server.baseUrl),
        (error) => {
          assert.notEqual(error.code, 0);
          assert.match(error.stderr, /unsupported region-dist manifest entry/i);
          return true;
        },
      );
    } finally {
      await server.close();
    }
  });
});
