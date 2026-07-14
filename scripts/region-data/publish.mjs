import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { constants, createReadStream } from "node:fs";

import { loadStagedRelease } from "./publish-staging.mjs";

const OBJECT_CACHE_CONTROL = "public, max-age=31536000, immutable";
const MANIFEST_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const R2_REGION_DATA_BUCKET = "ground-codes-region-data";
const READ_FLAGS =
  constants.O_RDONLY |
  (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);

export const createR2ClientFromEnvironment = (
  environment = process.env,
  ClientClass = S3Client,
) => {
  const required = [
    "CLOUDFLARE_ACCOUNT_ID",
    "R2_REGION_DATA_ACCESS_KEY_ID",
    "R2_REGION_DATA_SECRET_ACCESS_KEY",
  ];
  const missing = required.filter(
    (name) =>
      typeof environment[name] !== "string" || environment[name].length === 0,
  );
  if (missing.length > 0) {
    throw new TypeError(`missing R2 credentials: ${missing.join(", ")}`);
  }
  const client = new ClientClass({
    endpoint: `https://${environment.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: "auto",
    credentials: {
      accessKeyId: environment.R2_REGION_DATA_ACCESS_KEY_ID,
      secretAccessKey: environment.R2_REGION_DATA_SECRET_ACCESS_KEY,
    },
  });
  return { client, bucket: R2_REGION_DATA_BUCKET };
};

export const formatPublishResult = (result) =>
  [
    `published version=${result.version} objects=${result.objectCount} uploaded=${result.uploadedObjects} skipped=${result.skippedObjects} bytes=${result.uploadedBytes} manifest_uploaded=${Number(result.manifestUploaded)}`,
    ...result.uploadedObjectKeys.map((key) => `object ${key}`),
  ].join("\n");

const mapLimit = async (values, concurrency, worker) => {
  if (
    !Number.isSafeInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 32
  ) {
    throw new TypeError("publish concurrency must be an integer from 1 to 32");
  }
  let next = 0;
  const results = new Array(values.length);
  const run = async () => {
    for (;;) {
      const index = next++;
      if (index >= values.length) return;
      results[index] = await worker(values[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, run),
  );
  return results;
};

const isMissing = (error) =>
  error?.name === "NotFound" ||
  error?.name === "NoSuchKey" ||
  error?.$metadata?.httpStatusCode === 404;

const isRetryable = (error) => {
  const status = error?.$metadata?.httpStatusCode;
  const code = error?.code ?? error?.cause?.code;
  return (
    status === 429 ||
    status >= 500 ||
    [
      "ECONNRESET",
      "ECONNREFUSED",
      "EPIPE",
      "ETIMEDOUT",
      "UND_ERR_CONNECT_TIMEOUT",
      "UND_ERR_SOCKET",
    ].includes(code)
  );
};

const sendWithRetry = async (
  client,
  commandFactory,
  { attempts, retryDelayMs },
) => {
  if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 10) {
    throw new TypeError("publish attempts must be an integer from 1 to 10");
  }
  if (
    !Number.isSafeInteger(retryDelayMs) ||
    retryDelayMs < 0 ||
    retryDelayMs > 10_000
  ) {
    throw new TypeError("publish retry delay must be from 0 to 10000 ms");
  }
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await client.send(commandFactory());
    } catch (error) {
      if (!isRetryable(error) || attempt === attempts) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(retryDelayMs * 2 ** (attempt - 1), 1_000)),
      );
    }
  }
};

const headObject = async ({ client, bucket, key, requestOptions }) => {
  try {
    return await sendWithRetry(
      client,
      () => new HeadObjectCommand({ Bucket: bucket, Key: key }),
      requestOptions,
    );
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
};

const readResponseBody = async (body, maximumBytes) => {
  if (!body) throw new TypeError("R2 object response has no body");
  if (typeof body.transformToByteArray === "function") {
    const bytes = Buffer.from(await body.transformToByteArray());
    if (bytes.length > maximumBytes) {
      throw new TypeError("R2 object response exceeds its expected size");
    }
    return bytes;
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of body) {
    total += chunk.length;
    if (total > maximumBytes) {
      throw new TypeError("R2 object response exceeds its expected size");
    }
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks, total);
};

const objectMetadata = (entry) => ({
  CacheControl: OBJECT_CACHE_CONTROL,
  ContentType: "application/gzip",
  Metadata: {
    sha256: entry.sha256,
    "uncompressed-size": String(entry.size),
  },
});

const assertExistingObject = (head, entry) => {
  const expected = objectMetadata(entry);
  const metadataKeys = Object.keys(head.Metadata ?? {}).sort();
  if (
    head.ContentLength !== entry.compressedSize ||
    head.CacheControl !== expected.CacheControl ||
    head.ContentType !== expected.ContentType ||
    metadataKeys.length !== 2 ||
    metadataKeys[0] !== "sha256" ||
    metadataKeys[1] !== "uncompressed-size" ||
    head.Metadata?.sha256 !== expected.Metadata.sha256 ||
    head.Metadata?.["uncompressed-size"] !==
      expected.Metadata["uncompressed-size"]
  ) {
    throw new TypeError(`R2 object metadata conflicts for ${entry.objectKey}`);
  }
};

const resultFor = (release, outcomes, manifestUploaded) => {
  const totals = outcomes.reduce(
    (sum, outcome) => ({
      uploadedObjects: sum.uploadedObjects + outcome.uploaded,
      skippedObjects: sum.skippedObjects + outcome.skipped,
      uploadedBytes: sum.uploadedBytes + outcome.bytes,
    }),
    { uploadedObjects: 0, skippedObjects: 0, uploadedBytes: 0 },
  );
  return {
    version: release.manifest.version,
    objectCount: release.objects.length,
    ...totals,
    uploadedObjectKeys: outcomes
      .map((outcome) => outcome.uploadedKey)
      .filter(Boolean),
    manifestUploaded,
  };
};

const putObject = ({ client, bucket, entry, requestOptions }) =>
  sendWithRetry(
    client,
    () =>
      new PutObjectCommand({
        Bucket: bucket,
        Key: entry.objectKey,
        Body: createReadStream(entry.path, { flags: READ_FLAGS }),
        ContentLength: entry.compressedSize,
        ...objectMetadata(entry),
      }),
    requestOptions,
  );

const multipartObject = async ({
  client,
  bucket,
  entry,
  partSizeBytes,
  requestOptions,
}) => {
  const partCount = Math.ceil(entry.compressedSize / partSizeBytes);
  if (partCount > 10_000) {
    throw new TypeError(`${entry.objectKey} requires more than 10000 parts`);
  }
  let uploadId;
  try {
    const created = await sendWithRetry(
      client,
      () =>
        new CreateMultipartUploadCommand({
          Bucket: bucket,
          Key: entry.objectKey,
          ...objectMetadata(entry),
        }),
      requestOptions,
    );
    uploadId = created.UploadId;
    if (typeof uploadId !== "string" || uploadId.length === 0) {
      throw new TypeError(`multipart upload ID missing for ${entry.objectKey}`);
    }
    const parts = [];
    for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
      const start = (partNumber - 1) * partSizeBytes;
      const end = Math.min(entry.compressedSize - 1, start + partSizeBytes - 1);
      const uploaded = await sendWithRetry(
        client,
        () =>
          new UploadPartCommand({
            Bucket: bucket,
            Key: entry.objectKey,
            UploadId: uploadId,
            PartNumber: partNumber,
            Body: createReadStream(entry.path, {
              flags: READ_FLAGS,
              start,
              end,
            }),
            ContentLength: end - start + 1,
          }),
        requestOptions,
      );
      if (typeof uploaded.ETag !== "string" || uploaded.ETag.length === 0) {
        throw new TypeError(
          `multipart ETag missing for ${entry.objectKey} part ${partNumber}`,
        );
      }
      parts.push({ ETag: uploaded.ETag, PartNumber: partNumber });
    }
    await sendWithRetry(
      client,
      () =>
        new CompleteMultipartUploadCommand({
          Bucket: bucket,
          Key: entry.objectKey,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts },
        }),
      requestOptions,
    );
  } catch (error) {
    if (!uploadId) throw error;
    try {
      await sendWithRetry(
        client,
        () =>
          new AbortMultipartUploadCommand({
            Bucket: bucket,
            Key: entry.objectKey,
            UploadId: uploadId,
          }),
        requestOptions,
      );
    } catch (abortError) {
      throw new AggregateError(
        [error, abortError],
        `multipart upload and abort failed for ${entry.objectKey}`,
      );
    }
    throw error;
  }
};

export const publishRegionData = async ({
  stagingRoot,
  pointerPath,
  client,
  bucket,
  concurrency = 4,
  attempts = 3,
  retryDelayMs = 100,
  multipartThresholdBytes = 64 * 1024 * 1024,
  partSizeBytes = 64 * 1024 * 1024,
}) => {
  if (!client || typeof client.send !== "function") {
    throw new TypeError("an S3 client is required");
  }
  if (typeof bucket !== "string" || bucket.length === 0) {
    throw new TypeError("an R2 bucket is required");
  }
  if (
    !Number.isSafeInteger(multipartThresholdBytes) ||
    multipartThresholdBytes < 1 ||
    !Number.isSafeInteger(partSizeBytes) ||
    partSizeBytes < 1
  ) {
    throw new TypeError("multipart threshold and part size must be positive");
  }
  const requestOptions = { attempts, retryDelayMs };
  const release = await loadStagedRelease({ stagingRoot, pointerPath });
  const outcomes = await mapLimit(
    release.objects,
    concurrency,
    async (entry) => {
      const head = await headObject({
        client,
        bucket,
        key: entry.objectKey,
        requestOptions,
      });
      if (head) {
        assertExistingObject(head, entry);
        return { uploaded: 0, skipped: 1, bytes: 0, uploadedKey: null };
      }
      if (entry.compressedSize >= multipartThresholdBytes) {
        await multipartObject({
          client,
          bucket,
          entry,
          partSizeBytes,
          requestOptions,
        });
      } else {
        await putObject({ client, bucket, entry, requestOptions });
      }
      return {
        uploaded: 1,
        skipped: 0,
        bytes: entry.compressedSize,
        uploadedKey: entry.objectKey,
      };
    },
  );
  const manifestKey = `releases/${release.manifest.version}/manifest.json`;
  const manifestHead = await headObject({
    client,
    bucket,
    key: manifestKey,
    requestOptions,
  });
  if (manifestHead) {
    if (manifestHead.ContentLength !== release.manifestBytes.length) {
      throw new TypeError(`R2 manifest conflicts for ${manifestKey}`);
    }
    const response = await sendWithRetry(
      client,
      () => new GetObjectCommand({ Bucket: bucket, Key: manifestKey }),
      requestOptions,
    );
    const existingBytes = await readResponseBody(
      response.Body,
      release.manifestBytes.length,
    );
    if (!existingBytes.equals(release.manifestBytes)) {
      throw new TypeError(`R2 manifest conflicts for ${manifestKey}`);
    }
    return resultFor(release, outcomes, false);
  }
  await sendWithRetry(
    client,
    () =>
      new PutObjectCommand({
        Bucket: bucket,
        Key: manifestKey,
        Body: release.manifestBytes,
        ContentLength: release.manifestBytes.length,
        CacheControl: MANIFEST_CACHE_CONTROL,
        ContentType: "application/json",
      }),
    requestOptions,
  );
  return resultFor(release, outcomes, true);
};
