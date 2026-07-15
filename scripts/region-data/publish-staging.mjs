import { createHash } from "node:crypto";
import { constants, createReadStream } from "node:fs";
import { lstat, open } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

import { canonicalJson, sha256Hex, validateManifest } from "./manifest.mjs";

const READ_FLAGS =
  constants.O_RDONLY |
  (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);

const readRegularFile = async (path, label) => {
  const before = await lstat(path, { bigint: true });
  if (before.isSymbolicLink() || !before.isFile()) {
    throw new TypeError(`${label} must be a regular file`);
  }
  const handle = await open(path, READ_FLAGS);
  try {
    const opened = await handle.stat({ bigint: true });
    if (opened.dev !== before.dev || opened.ino !== before.ino) {
      throw new TypeError(`${label} changed before secure read`);
    }
    return await handle.readFile();
  } finally {
    await handle.close();
  }
};

const sameFile = (left, right) =>
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.size === right.size &&
  left.ctimeNs === right.ctimeNs &&
  left.mtimeNs === right.mtimeNs;

const verifyStagedObject = async (path, entry) => {
  const before = await lstat(path, { bigint: true });
  if (
    before.isSymbolicLink() ||
    !before.isFile() ||
    before.size !== BigInt(entry.compressedSize) ||
    (before.mode & 0o777n) !== 0o444n
  ) {
    throw new TypeError(`staged object ${entry.objectKey} is invalid`);
  }
  const hash = createHash("sha256");
  let size = 0;
  try {
    await pipeline(
      createReadStream(path, { flags: READ_FLAGS }),
      createGunzip(),
      new Writable({
        write(chunk, _encoding, callback) {
          size += chunk.length;
          if (size > entry.size) {
            callback(
              new TypeError("uncompressed object exceeds manifest size"),
            );
            return;
          }
          hash.update(chunk);
          callback();
        },
      }),
    );
  } catch (error) {
    throw new TypeError(
      `staged object ${entry.objectKey} failed gzip integrity: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const after = await lstat(path, { bigint: true });
  if (
    !sameFile(before, after) ||
    size !== entry.size ||
    hash.digest("hex") !== entry.sha256
  ) {
    throw new TypeError(`staged object ${entry.objectKey} failed integrity`);
  }
};

export const loadStagedRelease = async ({ stagingRoot, pointerPath }) => {
  const pointerBytes = await readRegularFile(
    resolve(pointerPath),
    "release pointer",
  );
  let pointer;
  try {
    pointer = JSON.parse(pointerBytes.toString("utf8"));
  } catch {
    throw new TypeError("release pointer is not valid JSON");
  }
  if (
    pointer?.schemaVersion !== 1 ||
    !/^sha256-[a-f0-9]{64}$/.test(pointer.version) ||
    !/^[a-f0-9]{64}$/.test(pointer.manifestSha256) ||
    Object.keys(pointer).length !== 3 ||
    !pointerBytes.equals(Buffer.from(canonicalJson(pointer)))
  ) {
    throw new TypeError("release pointer is malformed or non-canonical");
  }
  const releaseRoot = join(resolve(stagingRoot), "releases", pointer.version);
  const manifestBytes = await readRegularFile(
    join(releaseRoot, "manifest.json"),
    "release manifest",
  );
  if (sha256Hex(manifestBytes) !== pointer.manifestSha256) {
    throw new TypeError("staged manifest hash does not match the pointer");
  }
  let manifest;
  try {
    manifest = validateManifest(JSON.parse(manifestBytes.toString("utf8")));
  } catch (error) {
    throw new TypeError(
      `staged manifest is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (
    manifest.version !== pointer.version ||
    !manifestBytes.equals(Buffer.from(canonicalJson(manifest)))
  ) {
    throw new TypeError("staged manifest is conflicting or non-canonical");
  }
  const objects = [];
  const seen = new Set();
  for (const entry of manifest.entries) {
    if (seen.has(entry.objectKey)) continue;
    seen.add(entry.objectKey);
    const path = join(releaseRoot, "objects", `${entry.sha256}.json.gz`);
    await verifyStagedObject(path, entry);
    objects.push({ ...entry, path });
  }
  return { manifest, manifestBytes, objects };
};
