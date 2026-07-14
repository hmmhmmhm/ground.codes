import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import {
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
import { syncRegionData } from "./sync.mjs";

const temporaryDirectories = [];
const servers = [];
afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map(
        (server) =>
          new Promise((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          ),
      ),
  );
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

const temporaryDirectory = async () => {
  const path = await mkdtemp(join(tmpdir(), "region-sync-security-"));
  temporaryDirectories.push(path);
  return path;
};

const fixtureRelease = async () => {
  const sourceRoot = new URL("./fixtures/", import.meta.url);
  const manifest = await createManifest({ sourceRoot });
  const manifestBytes = Buffer.from(canonicalJson(manifest));
  const objects = new Map();
  for (const entry of manifest.entries) {
    if (objects.has(entry.objectKey)) continue;
    const relative = entry.path.replace("packages/geoint/", "");
    objects.set(
      entry.objectKey,
      deterministicGzip(
        await readFile(new URL(`./fixtures/${relative}`, import.meta.url)),
      ),
    );
  }
  return {
    manifest,
    manifestBytes,
    objects,
    pointer: {
      schemaVersion: 1,
      version: manifest.version,
      manifestSha256: sha256Hex(manifestBytes),
    },
  };
};

const startServer = async (release, handler) => {
  const requests = [];
  const server = createServer((request, response) => {
    const path = new URL(request.url, "http://local").pathname.replace(
      /^\//,
      "",
    );
    requests.push(path);
    if (
      handler?.({
        path,
        request,
        response,
        attempt: requests.filter((value) => value === path).length,
      })
    ) {
      return;
    }
    const body =
      path === `releases/${release.manifest.version}/manifest.json`
        ? release.manifestBytes
        : release.objects.get(path);
    if (!body) {
      response.writeHead(404).end("missing");
      return;
    }
    response.writeHead(200).end(body);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  servers.push(server);
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    requests,
  };
};

const pointerAt = async (root, pointer) => {
  const path = join(root, "pointer.json");
  await writeFile(path, canonicalJson(pointer));
  return path;
};

const optionsFor = (root, pointerPath, baseUrl, extra = {}) => ({
  root,
  pointerPath,
  baseUrl,
  groups: ["region-dist", "region-db"],
  retryDelayMs: 1,
  ...extra,
});

const runCli = (arguments_, { cwd, baseUrl }) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(new URL("../sync-region-data.mjs", import.meta.url)),
        ...arguments_,
      ],
      {
        cwd,
        env: { ...process.env, REGION_DATA_BASE_URL: baseUrl },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stderr, stdout }));
  });

describe("region-data sync security and CLI boundaries", () => {
  test("validates the pointer before any network request", async () => {
    const root = await temporaryDirectory();
    const invalidPointers = [
      {
        schemaVersion: 2,
        version: `sha256-${"a".repeat(64)}`,
        manifestSha256: "b".repeat(64),
      },
      { schemaVersion: 1, version: "latest", manifestSha256: "b".repeat(64) },
      {
        schemaVersion: 1,
        version: `sha256-${"a".repeat(64)}`,
        manifestSha256: "BAD",
      },
      {
        schemaVersion: 1,
        version: `sha256-${"a".repeat(64)}`,
        manifestSha256: "b".repeat(64),
        extra: true,
      },
    ];
    for (const pointer of invalidPointers) {
      let requests = 0;
      const pointerPath = await pointerAt(root, pointer);
      await assert.rejects(
        syncRegionData(
          optionsFor(root, pointerPath, "https://example.invalid", {
            fetchImpl: async () => {
              requests += 1;
              throw new Error("network must not run");
            },
          }),
        ),
        /pointer|schema|version|hash|field/i,
      );
      assert.equal(requests, 0);
    }
  });

  test("rejects a hash-valid malicious manifest without escaping root", async () => {
    const release = await fixtureRelease();
    release.manifest.entries[0].path =
      "packages/geoint/region-db/../../../../escape";
    release.manifestBytes = Buffer.from(canonicalJson(release.manifest));
    release.pointer.manifestSha256 = sha256Hex(release.manifestBytes);
    const container = await temporaryDirectory();
    const root = join(container, "materialized");
    await mkdir(root);
    const outside = join(container, "escape");
    await writeFile(outside, "sentinel");
    const pointerPath = await pointerAt(root, release.pointer);
    const server = await startServer(release);

    await assert.rejects(
      syncRegionData(optionsFor(root, pointerPath, server.baseUrl)),
      /outside|path|managed|normalized/i,
    );
    assert.equal(await readFile(outside, "utf8"), "sentinel");
    assert.equal(
      server.requests.some((path) => path.includes("/objects/")),
      false,
    );
  });

  test("does not follow a managed-root symlink", async () => {
    const release = await fixtureRelease();
    const root = await temporaryDirectory();
    const outside = await temporaryDirectory();
    const pointerPath = await pointerAt(root, release.pointer);
    await mkdir(join(root, "packages/geoint"), { recursive: true });
    await symlink(outside, join(root, "packages/geoint/region-dist"), "dir");
    const server = await startServer(release);

    await assert.rejects(
      syncRegionData(optionsFor(root, pointerPath, server.baseUrl)),
      /symlink|non-symlink directory/i,
    );
    assert.deepEqual(await readdir(outside), []);
  });

  test("retries only network failures while fetching the manifest", async () => {
    const release = await fixtureRelease();
    const root404 = await temporaryDirectory();
    const pointer404 = await pointerAt(root404, release.pointer);
    const missing = await startServer(release, ({ path, response }) => {
      if (!path.endsWith("manifest.json")) return false;
      response.writeHead(404).end("missing");
      return true;
    });
    await assert.rejects(
      syncRegionData(optionsFor(root404, pointer404, missing.baseUrl)),
      /HTTP 404/,
    );
    assert.equal(missing.requests.length, 1);

    const rootFailure = await temporaryDirectory();
    const pointerFailure = await pointerAt(rootFailure, release.pointer);
    let failureAttempts = 0;
    await assert.rejects(
      syncRegionData(
        optionsFor(rootFailure, pointerFailure, "https://example.invalid", {
          fetchImpl: async () => {
            failureAttempts += 1;
            throw new RangeError("fetch implementation bug");
          },
        }),
      ),
      /fetch implementation bug/,
    );
    assert.equal(failureAttempts, 1);

    const rootRetry = await temporaryDirectory();
    const pointerRetry = await pointerAt(rootRetry, release.pointer);
    const healthy = await startServer(release);
    let networkAttempts = 0;
    const fetchImpl = async (...arguments_) => {
      networkAttempts += 1;
      if (networkAttempts < 3) {
        const error = new TypeError("fetch failed");
        error.cause = { code: "ECONNRESET" };
        throw error;
      }
      return fetch(...arguments_);
    };
    const result = await syncRegionData(
      optionsFor(rootRetry, pointerRetry, healthy.baseUrl, { fetchImpl }),
    );
    assert.equal(result.downloaded, release.manifest.entries.length);
    assert.ok(networkAttempts >= release.manifest.entries.length + 2);
  });

  test("retries a network failure while streaming an object body", async () => {
    const release = await fixtureRelease();
    const entry = release.manifest.entries.find(
      ({ group }) => group === "region-dist",
    );
    const compressed = release.objects.get(entry.objectKey);
    let objectAttempts = 0;
    const server = await startServer(release, ({ path, response }) => {
      if (path !== entry.objectKey) return false;
      objectAttempts += 1;
      if (objectAttempts > 1) return false;
      response.writeHead(200, {
        "content-type": "application/octet-stream",
      });
      response.write(
        compressed.subarray(0, Math.max(1, compressed.length - 2)),
      );
      setImmediate(() => response.destroy(new Error("socket interrupted")));
      return true;
    });
    const root = await temporaryDirectory();
    const pointerPath = await pointerAt(root, release.pointer);

    const result = await syncRegionData({
      root,
      pointerPath,
      baseUrl: server.baseUrl,
      paths: [entry.path],
      retryDelayMs: 1,
    });

    assert.equal(result.downloaded, 1);
    assert.equal(objectAttempts, 2);
  });

  test("prunes only absent files in selected groups", async () => {
    const release = await fixtureRelease();
    const root = await temporaryDirectory();
    const pointerPath = await pointerAt(root, release.pointer);
    const distExtra = join(root, "packages/geoint/region-dist/extra.json");
    const dbExtra = join(root, "packages/geoint/region-db/extra.index");
    await Promise.all([
      mkdir(dirname(distExtra), { recursive: true }),
      mkdir(dirname(dbExtra), { recursive: true }),
    ]);
    await Promise.all([writeFile(distExtra, "x"), writeFile(dbExtra, "y")]);
    const server = await startServer(release);

    const result = await syncRegionData(
      optionsFor(root, pointerPath, server.baseUrl, {
        groups: ["region-dist"],
        prune: true,
      }),
    );
    assert.equal(result.pruned, 1);
    await assert.rejects(readFile(distExtra), /ENOENT/);
    assert.equal(await readFile(dbExtra, "utf8"), "y");
    await assert.rejects(
      syncRegionData({
        root,
        pointerPath,
        baseUrl: server.baseUrl,
        paths: ["packages/geoint/region-db/sample.index"],
        prune: true,
      }),
      /prune.*explicit/i,
    );
  });

  test("runs the approved CLI contract and root package commands", async () => {
    const release = await fixtureRelease();
    const cwd = await temporaryDirectory();
    const pointerPath = join(cwd, "packages/geoint/region-data-release.json");
    await mkdir(dirname(pointerPath), { recursive: true });
    await writeFile(pointerPath, canonicalJson(release.pointer));
    const server = await startServer(release);
    const valid = await runCli(["--groups", "region-dist,region-db"], {
      cwd,
      baseUrl: server.baseUrl,
    });
    assert.equal(valid.code, 0, valid.stderr);
    assert.match(valid.stdout, /^synced sha256-[a-f0-9]{64} /);
    const invalid = await runCli(["--unknown"], {
      cwd,
      baseUrl: server.baseUrl,
    });
    assert.notEqual(invalid.code, 0);
    assert.match(invalid.stderr, /unknown argument|usage/i);

    const packageJson = JSON.parse(
      await readFile(new URL("../../package.json", import.meta.url), "utf8"),
    );
    assert.equal(
      packageJson.scripts["region-data:sync"],
      "node scripts/sync-region-data.mjs --groups region-dist,region-db",
    );
    assert.equal(
      packageJson.scripts["region-data:sync:ci"],
      "node scripts/sync-region-data.mjs --groups region-dist,region-db --prune",
    );
  });
});
