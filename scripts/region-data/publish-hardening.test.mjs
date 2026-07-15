import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { afterEach, test } from "node:test";

import { publishRegionData } from "./publish.mjs";
import {
  cleanupPublishFixtures,
  createStagedRelease,
  FakeS3Client,
} from "./publish-test-helpers.mjs";

afterEach(cleanupPublishFixtures);

const CACHE_CONTROL = "public, max-age=31536000, immutable";
const objectMetadata = (entry) => ({
  CacheControl: CACHE_CONTROL,
  ContentType: "application/gzip",
  Metadata: {
    sha256: entry.sha256,
    "uncompressed-size": String(entry.size),
  },
});

const optionsFor = (release, client, extra = {}) => ({
  stagingRoot: release.stagingRoot,
  pointerPath: release.pointerPath,
  client,
  bucket: "fixture-bucket",
  retryDelayMs: 0,
  ...extra,
});

const stagedObjectBytes = (release, entry) =>
  readFile(join(release.releaseRoot, "objects", `${entry.sha256}.json.gz`));

test("rejects invalid publisher limits before issuing an upload", async () => {
  const client = new FakeS3Client();
  await assert.rejects(
    publishRegionData({ client: null, bucket: "fixture" }),
    /S3 client/i,
  );
  await assert.rejects(publishRegionData({ client, bucket: "" }), /bucket/i);
  for (const extra of [{ multipartThresholdBytes: 0 }, { partSizeBytes: 0 }]) {
    await assert.rejects(
      publishRegionData({ client, bucket: "fixture", ...extra }),
      /multipart threshold and part size/i,
    );
  }

  const release = await createStagedRelease({
    "region-dist/sample.json": Buffer.from("limits"),
  });
  for (const extra of [
    { concurrency: 0 },
    { attempts: 0 },
    { retryDelayMs: -1 },
  ]) {
    await assert.rejects(
      publishRegionData(optionsFor(release, new FakeS3Client(), extra)),
      /concurrency|attempts|retry delay/i,
    );
  }
});

test("classifies alternate missing and network errors without hiding 403", async () => {
  const release = await createStagedRelease({
    "region-dist/sample.json": Buffer.from("classify"),
  });
  const entry = release.manifest.entries[0];
  for (const missingError of [
    Object.assign(new Error("missing"), { name: "NoSuchKey" }),
    Object.assign(new Error("missing"), {
      name: "R2Error",
      $metadata: { httpStatusCode: 404 },
    }),
  ]) {
    const client = new FakeS3Client({
      onSend({ input, name }) {
        if (name === "HeadObjectCommand" && input.Key === entry.objectKey) {
          throw missingError;
        }
      },
    });
    const result = await publishRegionData(optionsFor(release, client));
    assert.equal(result.uploadedObjects, 1);
  }

  const forbidden = new FakeS3Client({
    onSend({ name }) {
      if (name === "HeadObjectCommand") {
        const error = new Error("forbidden");
        error.$metadata = { httpStatusCode: 403 };
        throw error;
      }
    },
  });
  await assert.rejects(
    publishRegionData(optionsFor(release, forbidden)),
    /forbidden/,
  );

  const network = new FakeS3Client({
    onSend({ attempt, input, name }) {
      if (
        name === "PutObjectCommand" &&
        input.Key === entry.objectKey &&
        attempt === 1
      ) {
        throw Object.assign(new Error("reset"), { code: "ECONNRESET" });
      }
    },
  });
  const retried = await publishRegionData(optionsFor(release, network));
  assert.equal(retried.uploadedObjects, 1);
});

test("bounds existing manifest response bodies and compares exact bytes", async () => {
  const release = await createStagedRelease({
    "region-dist/sample.json": Buffer.from("existing manifest"),
  });
  const entry = release.manifest.entries[0];
  const manifestKey = `releases/${release.manifest.version}/manifest.json`;
  const prepare = async (onSend) => {
    const client = new FakeS3Client({ onSend });
    client.preload(
      entry.objectKey,
      await stagedObjectBytes(release, entry),
      objectMetadata(entry),
    );
    client.preload(manifestKey, release.manifestBytes, {
      CacheControl: CACHE_CONTROL,
      ContentType: "application/json",
      Metadata: {},
    });
    return client;
  };

  const transformed = await prepare(({ input, name }) => {
    if (name === "GetObjectCommand" && input.Key === manifestKey) {
      return {
        Body: {
          transformToByteArray: async () => release.manifestBytes,
        },
      };
    }
  });
  assert.equal(
    (await publishRegionData(optionsFor(release, transformed)))
      .manifestUploaded,
    false,
  );

  const noBody = await prepare(({ name }) =>
    name === "GetObjectCommand" ? {} : undefined,
  );
  await assert.rejects(
    publishRegionData(optionsFor(release, noBody)),
    /response has no body/i,
  );

  const oversized = await prepare(({ name }) =>
    name === "GetObjectCommand"
      ? { Body: Readable.from(Buffer.alloc(release.manifestBytes.length + 1)) }
      : undefined,
  );
  await assert.rejects(
    publishRegionData(optionsFor(release, oversized)),
    /exceeds its expected size/i,
  );

  const conflictingBytes = Buffer.from(release.manifestBytes);
  conflictingBytes[0] ^= 1;
  const conflicting = await prepare(({ name }) =>
    name === "GetObjectCommand"
      ? { Body: Readable.from(conflictingBytes) }
      : undefined,
  );
  await assert.rejects(
    publishRegionData(optionsFor(release, conflicting)),
    /manifest conflicts/i,
  );
});

test("fails closed and aborts incomplete multipart uploads", async () => {
  const release = await createStagedRelease({
    "region-dist/sample.json": randomBytes(16 * 1024),
  });
  const entry = release.manifest.entries[0];
  await assert.rejects(
    publishRegionData(
      optionsFor(release, new FakeS3Client(), {
        multipartThresholdBytes: 1,
        partSizeBytes: 1,
      }),
    ),
    /more than 10000 parts/i,
  );

  const missingUploadId = new FakeS3Client({
    onSend({ name }) {
      if (name === "CreateMultipartUploadCommand") return {};
    },
  });
  await assert.rejects(
    publishRegionData(
      optionsFor(release, missingUploadId, {
        multipartThresholdBytes: 1024,
        partSizeBytes: 2048,
      }),
    ),
    /upload ID missing/i,
  );

  const missingEtag = new FakeS3Client({
    onSend({ input, name }) {
      if (name === "UploadPartCommand" && input.PartNumber === 1) return {};
    },
  });
  await assert.rejects(
    publishRegionData(
      optionsFor(release, missingEtag, {
        multipartThresholdBytes: 1024,
        partSizeBytes: 2048,
      }),
    ),
    /ETag missing/i,
  );
  assert.equal(
    missingEtag.calls.some(
      ({ name }) => name === "AbortMultipartUploadCommand",
    ),
    true,
  );
});
