import assert from "node:assert/strict";
import { createServer } from "node:http";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, test } from "node:test";

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
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

const temporaryDirectory = async (prefix = "region-sync-") => {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
};

const makeRelease = async (files) => {
  const root = await temporaryDirectory("region-sync-source-");
  await Promise.all(
    ["region-dist", "region-db"].map((group) =>
      mkdir(join(root, group), { recursive: true }),
    ),
  );
  for (const [relativePath, contents] of Object.entries(files)) {
    const destination = join(root, ...relativePath.split("/"));
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, contents);
  }
  const manifest = await createManifest({ sourceRoot: root });
  const manifestBytes = Buffer.from(canonicalJson(manifest));
  const pointer = {
    schemaVersion: 1,
    version: manifest.version,
    manifestSha256: sha256Hex(manifestBytes),
  };
  const objects = new Map();
  const logicalFiles = new Map();
  for (const entry of manifest.entries) {
    const relative = entry.path.replace("packages/geoint/", "");
    const contents = await readFile(join(root, relative));
    logicalFiles.set(entry.path, contents);
    if (objects.has(entry.objectKey)) continue;
    objects.set(entry.objectKey, deterministicGzip(contents));
  }
  return { files: logicalFiles, manifest, manifestBytes, objects, pointer };
};

const writePointer = async (root, pointer) => {
  const path = join(root, "region-data-release.json");
  await writeFile(path, canonicalJson(pointer));
  return path;
};

const startReleaseServer = async (
  release,
  { responses = new Map(), responseDelayMs = 0 } = {},
) => {
  const stats = {
    active: 0,
    maxActive: 0,
    requests: new Map(),
  };
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent(
      new URL(request.url, "http://local").pathname,
    ).replace(/^\//, "");
    stats.active += 1;
    stats.maxActive = Math.max(stats.maxActive, stats.active);
    stats.requests.set(path, (stats.requests.get(path) ?? 0) + 1);
    try {
      const override = responses.get(path);
      const attempt = stats.requests.get(path);
      const selected = Array.isArray(override)
        ? override[Math.min(attempt - 1, override.length - 1)]
        : override;
      if (responseDelayMs > 0)
        await new Promise((resolve) => setTimeout(resolve, responseDelayMs));
      if (selected?.status) {
        response.writeHead(selected.status);
        response.end(selected.body ?? "error");
        return;
      }
      const body =
        selected?.body ??
        (path === `releases/${release.manifest.version}/manifest.json`
          ? release.manifestBytes
          : release.objects.get(path));
      if (!body) {
        response.writeHead(404);
        response.end("missing");
        return;
      }
      response.writeHead(200, { "content-type": "application/octet-stream" });
      response.end(body);
    } finally {
      stats.active -= 1;
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  servers.push(server);
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    stats,
  };
};

const sync = ({ root, pointerPath, baseUrl, ...options }) =>
  syncRegionData({ root, pointerPath, baseUrl, ...options });

const destination = (root, logicalPath) =>
  join(root, ...logicalPath.split("/"));

const temporaryArtifacts = async (root) => {
  const found = [];
  const visit = async (directory) => {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.name.includes(".region-sync-")) found.push(path);
    }
  };
  await visit(root);
  return found;
};

describe("verified region-data synchronization", () => {
  test("downloads a full release and skips already-valid files", async () => {
    const release = await makeRelease({
      "region-db/sample.index": Buffer.from("shared"),
      "region-db/sample/000001.log": Buffer.from([0, 255, 1, 2]),
      "region-dist/sample.json": Buffer.from("shared"),
    });
    const root = await temporaryDirectory();
    const pointerPath = await writePointer(root, release.pointer);
    const server = await startReleaseServer(release);

    const first = await sync({
      root,
      pointerPath,
      baseUrl: server.baseUrl,
      groups: ["region-dist", "region-db"],
    });
    assert.deepEqual(
      {
        version: first.version,
        selected: first.selected,
        downloaded: first.downloaded,
        skipped: first.skipped,
      },
      {
        version: release.manifest.version,
        selected: 3,
        downloaded: 3,
        skipped: 0,
      },
    );
    for (const entry of release.manifest.entries) {
      assert.deepEqual(
        await readFile(destination(root, entry.path)),
        release.files.get(entry.path),
      );
    }
    const objectRequests = [...server.stats.requests.entries()]
      .filter(([path]) => path.includes("/objects/"))
      .reduce((sum, [, count]) => sum + count, 0);
    const second = await sync({
      root,
      pointerPath,
      baseUrl: server.baseUrl,
      groups: ["region-dist", "region-db"],
    });
    assert.equal(second.downloaded, 0);
    assert.equal(second.skipped, 3);
    assert.equal(
      [...server.stats.requests.entries()]
        .filter(([path]) => path.includes("/objects/"))
        .reduce((sum, [, count]) => sum + count, 0),
      objectRequests,
    );
    assert.deepEqual(await temporaryArtifacts(root), []);
  });

  test("atomically replaces corrupt files and preserves extras by default", async () => {
    const release = await makeRelease({
      "region-db/sample.index": Buffer.from("db"),
      "region-dist/sample.json": Buffer.from("correct"),
    });
    const root = await temporaryDirectory();
    const pointerPath = await writePointer(root, release.pointer);
    const target = destination(root, "packages/geoint/region-dist/sample.json");
    const extra = destination(root, "packages/geoint/region-dist/extra.json");
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, "corrupt");
    await writeFile(extra, "keep");
    const server = await startReleaseServer(release, { responseDelayMs: 25 });

    const pending = sync({
      root,
      pointerPath,
      baseUrl: server.baseUrl,
      groups: ["region-dist"],
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(await readFile(target, "utf8"), "corrupt");
    const result = await pending;

    assert.equal(result.downloaded, 1);
    assert.equal(await readFile(target, "utf8"), "correct");
    assert.equal(await readFile(extra, "utf8"), "keep");
    assert.deepEqual(await temporaryArtifacts(root), []);
  });

  test("rejects manifest hash mismatches before requesting objects", async () => {
    const release = await makeRelease({
      "region-db/sample.index": Buffer.from("db"),
      "region-dist/sample.json": Buffer.from("dist"),
    });
    release.pointer.manifestSha256 = "0".repeat(64);
    const root = await temporaryDirectory();
    const pointerPath = await writePointer(root, release.pointer);
    const server = await startReleaseServer(release);

    await assert.rejects(
      sync({
        root,
        pointerPath,
        baseUrl: server.baseUrl,
        groups: ["region-dist", "region-db"],
      }),
      /manifest.*hash/i,
    );
    assert.equal(
      [...server.stats.requests.keys()].some((path) =>
        path.includes("/objects/"),
      ),
      false,
    );
  });

  test("fails closed for bad objects, truncated gzip, and object 404", async () => {
    for (const variant of ["hash", "gzip", "404"]) {
      const release = await makeRelease({
        "region-db/sample.index": Buffer.from("db"),
        "region-dist/sample.json": Buffer.from("correct bytes"),
      });
      const root = await temporaryDirectory();
      const pointerPath = await writePointer(root, release.pointer);
      const entry = release.manifest.entries.find(
        ({ group }) => group === "region-dist",
      );
      const original = release.objects.get(entry.objectKey);
      const responses = new Map([
        [
          entry.objectKey,
          variant === "404"
            ? { status: 404 }
            : {
                body:
                  variant === "gzip"
                    ? original.subarray(0, Math.max(1, original.length - 4))
                    : deterministicGzip(Buffer.from("wrong bytes")),
              },
        ],
      ]);
      const server = await startReleaseServer(release, { responses });
      const target = destination(root, entry.path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, "old-corrupt");

      await assert.rejects(
        sync({
          root,
          pointerPath,
          baseUrl: server.baseUrl,
          groups: ["region-dist"],
        }),
        variant === "404" ? /404/ : /gzip|hash|size|integrity|decompress/i,
        variant,
      );
      assert.equal(await readFile(target, "utf8"), "old-corrupt");
      assert.equal(server.stats.requests.get(entry.objectKey), 1);
      assert.deepEqual(await temporaryArtifacts(root), []);
    }
  });

  test("retries only retryable responses and respects bounded concurrency", async () => {
    const files = Object.fromEntries(
      Array.from({ length: 6 }, (_, index) => [
        `region-dist/${index}.json`,
        Buffer.from(`value-${index}`),
      ]),
    );
    files["region-db/sample.index"] = Buffer.from("db");
    const release = await makeRelease(files);
    const retryEntry = release.manifest.entries.find(({ path }) =>
      path.endsWith("0.json"),
    );
    const responses = new Map([
      [
        retryEntry.objectKey,
        [
          { status: 429 },
          { status: 503 },
          { body: release.objects.get(retryEntry.objectKey) },
        ],
      ],
    ]);
    const root = await temporaryDirectory();
    const pointerPath = await writePointer(root, release.pointer);
    const server = await startReleaseServer(release, {
      responses,
      responseDelayMs: 10,
    });

    const result = await sync({
      root,
      pointerPath,
      baseUrl: server.baseUrl,
      groups: ["region-dist"],
      concurrency: 2,
      retryDelayMs: 1,
    });

    assert.equal(result.downloaded, 6);
    assert.equal(server.stats.requests.get(retryEntry.objectKey), 3);
    assert.ok(server.stats.maxActive <= 2, server.stats.maxActive);
  });

  test("supports group and explicit-path scopes", async () => {
    const release = await makeRelease({
      "region-db/a.index": Buffer.from("a"),
      "region-db/b.index": Buffer.from("b"),
      "region-dist/a.json": Buffer.from("dist"),
    });
    const root = await temporaryDirectory();
    const pointerPath = await writePointer(root, release.pointer);
    const server = await startReleaseServer(release);

    await sync({
      root,
      pointerPath,
      baseUrl: server.baseUrl,
      groups: ["region-dist"],
    });
    assert.equal(
      await readFile(
        destination(root, "packages/geoint/region-dist/a.json"),
        "utf8",
      ),
      "dist",
    );
    await assert.rejects(
      readFile(destination(root, "packages/geoint/region-db/a.index")),
      /ENOENT/,
    );

    const explicitRoot = await temporaryDirectory();
    const explicitPointer = await writePointer(explicitRoot, release.pointer);
    const selectedPath = "packages/geoint/region-db/b.index";
    const result = await sync({
      root: explicitRoot,
      pointerPath: explicitPointer,
      baseUrl: server.baseUrl,
      paths: [selectedPath],
    });
    assert.equal(result.selected, 1);
    assert.equal(
      await readFile(destination(explicitRoot, selectedPath), "utf8"),
      "b",
    );
  });
});
