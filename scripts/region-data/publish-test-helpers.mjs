import { Readable } from "node:stream";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { generateRelease } from "./generate-release.mjs";
import { removeWritableTree } from "./test-cleanup.mjs";

const temporaryDirectories = [];

export const cleanupPublishFixtures = async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((path) => removeWritableTree(path)),
  );
};

export const createStagedRelease = async (files) => {
  const container = await mkdtemp(join(tmpdir(), "region-publish-"));
  temporaryDirectories.push(container);
  const sourceRoot = join(container, "source");
  const stagingRoot = join(container, "staging");
  const pointerPath = join(container, "region-data-release.json");
  await Promise.all(
    ["region-dist", "region-db"].map((group) =>
      mkdir(join(sourceRoot, group), { recursive: true }),
    ),
  );
  for (const [relativePath, bytes] of Object.entries(files)) {
    const path = join(sourceRoot, ...relativePath.split("/"));
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
  await generateRelease({ sourceRoot, stagingRoot, pointerPath });
  const pointer = JSON.parse(await readFile(pointerPath, "utf8"));
  const releaseRoot = join(stagingRoot, "releases", pointer.version);
  const manifestBytes = await readFile(join(releaseRoot, "manifest.json"));
  return {
    manifest: JSON.parse(manifestBytes),
    manifestBytes,
    pointerPath,
    releaseRoot,
    stagingRoot,
  };
};

const bodyBytes = async (body) => {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body?.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};

const notFound = () => {
  const error = new Error("not found");
  error.name = "NotFound";
  error.$metadata = { httpStatusCode: 404 };
  return error;
};

const metadataFrom = (input) => ({
  CacheControl: input.CacheControl,
  ContentType: input.ContentType,
  Metadata: { ...(input.Metadata ?? {}) },
});

export class FakeS3Client {
  constructor({ delayMs = 0, onSend } = {}) {
    this.active = 0;
    this.attempts = new Map();
    this.calls = [];
    this.delayMs = delayMs;
    this.maxActive = 0;
    this.multipart = new Map();
    this.nextUploadId = 1;
    this.objects = new Map();
    this.onSend = onSend;
  }

  preload(key, bytes, metadata) {
    this.objects.set(key, { bytes: Buffer.from(bytes), ...metadata });
  }

  async send(command) {
    const name = command.constructor.name;
    const input = command.input;
    const attemptKey = `${name}:${input.Key}:${input.PartNumber ?? ""}`;
    const attempt = (this.attempts.get(attemptKey) ?? 0) + 1;
    this.attempts.set(attemptKey, attempt);
    const call = { name, key: input.Key, partNumber: input.PartNumber };
    this.calls.push(call);
    this.active += 1;
    this.maxActive = Math.max(this.maxActive, this.active);
    try {
      const overridden = await this.onSend?.({ attempt, input, name });
      if (overridden !== undefined) return overridden;
      if (this.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.delayMs));
      }
      if (name === "HeadObjectCommand") {
        const object = this.objects.get(input.Key);
        if (!object) throw notFound();
        return {
          ContentLength: object.bytes.length,
          CacheControl: object.CacheControl,
          ContentType: object.ContentType,
          Metadata: { ...object.Metadata },
        };
      }
      if (name === "GetObjectCommand") {
        const object = this.objects.get(input.Key);
        if (!object) throw notFound();
        return { Body: Readable.from(object.bytes) };
      }
      if (name === "PutObjectCommand") {
        const bytes = await bodyBytes(input.Body);
        call.bodyBytes = bytes;
        this.objects.set(input.Key, { bytes, ...metadataFrom(input) });
        return {};
      }
      if (name === "CreateMultipartUploadCommand") {
        const uploadId = `upload-${this.nextUploadId++}`;
        this.multipart.set(uploadId, {
          key: input.Key,
          metadata: metadataFrom(input),
          parts: new Map(),
        });
        return { UploadId: uploadId };
      }
      if (name === "UploadPartCommand") {
        const upload = this.multipart.get(input.UploadId);
        if (!upload) throw notFound();
        const bytes = await bodyBytes(input.Body);
        call.bodyBytes = bytes;
        upload.parts.set(input.PartNumber, bytes);
        return { ETag: `etag-${input.PartNumber}` };
      }
      if (name === "CompleteMultipartUploadCommand") {
        const upload = this.multipart.get(input.UploadId);
        if (!upload) throw notFound();
        const bytes = Buffer.concat(
          input.MultipartUpload.Parts.map(({ PartNumber }) =>
            upload.parts.get(PartNumber),
          ),
        );
        this.objects.set(upload.key, { bytes, ...upload.metadata });
        this.multipart.delete(input.UploadId);
        return {};
      }
      if (name === "AbortMultipartUploadCommand") {
        this.multipart.delete(input.UploadId);
        return {};
      }
      throw new Error(`unsupported fake command: ${name}`);
    } finally {
      this.active -= 1;
    }
  }
}
