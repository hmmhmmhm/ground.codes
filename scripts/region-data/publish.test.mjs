import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, test } from "node:test";

import { publishRegionData } from "./publish.mjs";
import {
  cleanupPublishFixtures,
  createStagedRelease,
  FakeS3Client,
} from "./publish-test-helpers.mjs";

afterEach(cleanupPublishFixtures);

const OBJECT_CACHE_CONTROL = "public, max-age=31536000, immutable";

test("uploads missing unique objects before the immutable manifest", async () => {
  const release = await createStagedRelease({
    "region-db/sample.index": Buffer.from("shared"),
    "region-db/sample/000001.log": Buffer.from([0, 255, 1, 2]),
    "region-dist/sample.json": Buffer.from("shared"),
  });
  const client = new FakeS3Client({ delayMs: 2 });

  const result = await publishRegionData({
    stagingRoot: release.stagingRoot,
    pointerPath: release.pointerPath,
    client,
    bucket: "fixture-bucket",
    concurrency: 2,
    attempts: 3,
    retryDelayMs: 0,
  });

  assert.deepEqual(
    {
      version: result.version,
      objectCount: result.objectCount,
      uploadedObjects: result.uploadedObjects,
      skippedObjects: result.skippedObjects,
      manifestUploaded: result.manifestUploaded,
    },
    {
      version: release.manifest.version,
      objectCount: 2,
      uploadedObjects: 2,
      skippedObjects: 0,
      manifestUploaded: true,
    },
  );
  assert.deepEqual(result.uploadedObjectKeys, [
    ...new Set(release.manifest.entries.map((entry) => entry.objectKey)),
  ]);
  const manifestKey = `releases/${release.manifest.version}/manifest.json`;
  assert.equal(client.calls.at(-1).name, "PutObjectCommand");
  assert.equal(client.calls.at(-1).key, manifestKey);
  assert.deepEqual(
    client.objects.get(manifestKey).bytes,
    release.manifestBytes,
  );

  const entriesByKey = new Map(
    release.manifest.entries.map((entry) => [entry.objectKey, entry]),
  );
  assert.equal(entriesByKey.size, 2);
  for (const [objectKey, entry] of entriesByKey) {
    const stored = client.objects.get(objectKey);
    assert.deepEqual(
      stored.bytes,
      await readFile(
        join(release.releaseRoot, "objects", `${entry.sha256}.json.gz`),
      ),
    );
    assert.deepEqual(
      {
        CacheControl: stored.CacheControl,
        ContentType: stored.ContentType,
        Metadata: stored.Metadata,
      },
      {
        CacheControl: OBJECT_CACHE_CONTROL,
        ContentType: "application/gzip",
        Metadata: {
          sha256: entry.sha256,
          "uncompressed-size": String(entry.size),
        },
      },
    );
  }
  assert.ok(client.maxActive <= 2, client.maxActive);
});

test("skips only matching objects and rejects conflicting metadata", async () => {
  const release = await createStagedRelease({
    "region-dist/sample.json": Buffer.from("existing"),
  });
  const entry = release.manifest.entries[0];
  const objectBytes = await readFile(
    join(release.releaseRoot, "objects", `${entry.sha256}.json.gz`),
  );
  const metadata = {
    CacheControl: OBJECT_CACHE_CONTROL,
    ContentType: "application/gzip",
    Metadata: {
      sha256: entry.sha256,
      "uncompressed-size": String(entry.size),
    },
  };
  const matching = new FakeS3Client();
  matching.preload(entry.objectKey, objectBytes, metadata);

  const result = await publishRegionData({
    stagingRoot: release.stagingRoot,
    pointerPath: release.pointerPath,
    client: matching,
    bucket: "fixture-bucket",
  });
  assert.equal(result.uploadedObjects, 0);
  assert.equal(result.skippedObjects, 1);
  assert.equal(
    matching.calls.some(
      ({ name, key }) => name === "PutObjectCommand" && key === entry.objectKey,
    ),
    false,
  );

  const conflicting = new FakeS3Client();
  conflicting.preload(entry.objectKey, objectBytes, {
    ...metadata,
    Metadata: { ...metadata.Metadata, unexpected: "conflict" },
  });
  await assert.rejects(
    publishRegionData({
      stagingRoot: release.stagingRoot,
      pointerPath: release.pointerPath,
      client: conflicting,
      bucket: "fixture-bucket",
    }),
    /metadata conflicts.*objects/i,
  );
  assert.equal(
    conflicting.calls.some(({ name }) => name === "PutObjectCommand"),
    false,
  );
});

test("accepts only an exactly matching existing manifest", async () => {
  const release = await createStagedRelease({
    "region-dist/sample.json": Buffer.from("immutable"),
  });
  const entry = release.manifest.entries[0];
  const objectBytes = await readFile(
    join(release.releaseRoot, "objects", `${entry.sha256}.json.gz`),
  );
  const objectMetadata = {
    CacheControl: OBJECT_CACHE_CONTROL,
    ContentType: "application/gzip",
    Metadata: {
      sha256: entry.sha256,
      "uncompressed-size": String(entry.size),
    },
  };
  const manifestKey = `releases/${release.manifest.version}/manifest.json`;
  const matching = new FakeS3Client();
  matching.preload(entry.objectKey, objectBytes, objectMetadata);
  matching.preload(manifestKey, release.manifestBytes, {
    CacheControl: OBJECT_CACHE_CONTROL,
    ContentType: "application/json",
    Metadata: {},
  });

  const result = await publishRegionData({
    stagingRoot: release.stagingRoot,
    pointerPath: release.pointerPath,
    client: matching,
    bucket: "fixture-bucket",
  });
  assert.equal(result.manifestUploaded, false);
  assert.equal(
    matching.calls.some(
      ({ name, key }) => name === "GetObjectCommand" && key === manifestKey,
    ),
    true,
  );

  const conflicting = new FakeS3Client();
  conflicting.preload(entry.objectKey, objectBytes, objectMetadata);
  conflicting.preload(manifestKey, Buffer.from("different"), {
    CacheControl: OBJECT_CACHE_CONTROL,
    ContentType: "application/json",
    Metadata: {},
  });
  await assert.rejects(
    publishRegionData({
      stagingRoot: release.stagingRoot,
      pointerPath: release.pointerPath,
      client: conflicting,
      bucket: "fixture-bucket",
    }),
    /manifest.*conflicts/i,
  );
  assert.equal(
    conflicting.calls.some(({ name }) => name === "PutObjectCommand"),
    false,
  );
});

test("retries a transient object upload with a fresh request body", async () => {
  const release = await createStagedRelease({
    "region-dist/sample.json": Buffer.from("retry me"),
  });
  const entry = release.manifest.entries[0];
  const client = new FakeS3Client({
    onSend({ attempt, input, name }) {
      if (
        name === "PutObjectCommand" &&
        input.Key === entry.objectKey &&
        attempt === 1
      ) {
        const error = new Error("temporary R2 failure");
        error.$metadata = { httpStatusCode: 503 };
        throw error;
      }
    },
  });

  const result = await publishRegionData({
    stagingRoot: release.stagingRoot,
    pointerPath: release.pointerPath,
    client,
    bucket: "fixture-bucket",
    attempts: 3,
    retryDelayMs: 0,
  });

  assert.equal(result.uploadedObjects, 1);
  assert.equal(client.attempts.get(`PutObjectCommand:${entry.objectKey}:`), 2);
  assert.equal(client.objects.has(entry.objectKey), true);
});

test("uses bounded multipart uploads for large objects", async () => {
  const release = await createStagedRelease({
    "region-dist/a.json": randomBytes(16 * 1024),
    "region-dist/b.json": randomBytes(16 * 1024),
  });
  const client = new FakeS3Client({ delayMs: 2 });

  const result = await publishRegionData({
    stagingRoot: release.stagingRoot,
    pointerPath: release.pointerPath,
    client,
    bucket: "fixture-bucket",
    concurrency: 2,
    attempts: 3,
    retryDelayMs: 0,
    multipartThresholdBytes: 1024,
    partSizeBytes: 2048,
  });

  assert.equal(result.uploadedObjects, 2);
  assert.equal(
    client.calls.filter(({ name }) => name === "CreateMultipartUploadCommand")
      .length,
    2,
  );
  assert.ok(
    client.calls.filter(({ name }) => name === "UploadPartCommand").length > 2,
  );
  assert.equal(
    client.calls.filter(
      ({ name, key }) =>
        name === "PutObjectCommand" && key.includes("/objects/"),
    ).length,
    0,
  );
  assert.equal(
    client.calls.filter(({ name }) => name === "CompleteMultipartUploadCommand")
      .length,
    2,
  );
  assert.ok(client.maxActive >= 2, client.maxActive);
  assert.ok(client.maxActive <= 2, client.maxActive);
  assert.equal(client.multipart.size, 0);
  for (const entry of release.manifest.entries) {
    assert.deepEqual(
      client.objects.get(entry.objectKey).bytes,
      await readFile(
        join(release.releaseRoot, "objects", `${entry.sha256}.json.gz`),
      ),
    );
  }
});

test("rejects a same-size corrupt staged object before any R2 request", async () => {
  const release = await createStagedRelease({
    "region-dist/sample.json": Buffer.from("publish integrity"),
  });
  const entry = release.manifest.entries[0];
  const objectPath = join(
    release.releaseRoot,
    "objects",
    `${entry.sha256}.json.gz`,
  );
  const corrupt = await readFile(objectPath);
  corrupt[corrupt.length - 1] ^= 0xff;
  await chmod(objectPath, 0o644);
  await writeFile(objectPath, corrupt);
  await chmod(objectPath, 0o444);
  const client = new FakeS3Client();

  await assert.rejects(
    publishRegionData({
      stagingRoot: release.stagingRoot,
      pointerPath: release.pointerPath,
      client,
      bucket: "fixture-bucket",
    }),
    /staged object.*integrity|gzip|decompress/i,
  );
  assert.deepEqual(client.calls, []);
});
