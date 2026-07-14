import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { isAbsolute, posix, resolve } from "node:path";
import { gzipSync } from "node:zlib";

import {
  enumerateManagedFiles,
  MANAGED_GROUPS,
} from "./manifest-filesystem.mjs";

const SCHEMA_VERSION = 1;
const GROUPS = MANAGED_GROUPS;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const VERSION_PATTERN = /^sha256-[a-f0-9]{64}$/;
const compareText = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

const assertPlainObject = (value, label) => {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new TypeError(`${label} must be a plain object`);
  }
};

const assertExactKeys = (value, expectedKeys, label) => {
  assertPlainObject(value, label);
  const actual = Object.keys(value).sort(compareText);
  const expected = [...expectedKeys].sort(compareText);
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new TypeError(`${label} has unsupported fields`);
  }
};

const canonicalize = (value, ancestors) => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new TypeError("canonical JSON requires finite numbers");
    return value;
  }
  if (typeof value !== "object") {
    throw new TypeError("canonical JSON contains an unsupported value");
  }
  if (ancestors.has(value))
    throw new TypeError("canonical JSON cannot be cyclic");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => canonicalize(item, ancestors));
    }
    assertPlainObject(value, "canonical JSON object");
    return Object.fromEntries(
      Object.keys(value)
        .sort(compareText)
        .map((key) => [key, canonicalize(value[key], ancestors)]),
    );
  } finally {
    ancestors.delete(value);
  }
};

export const canonicalJson = (value) =>
  JSON.stringify(canonicalize(value, new Set()));
export const sha256Hex = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

const normalizedGzip = (bytes) => {
  const compressed = gzipSync(bytes, { level: 9, mtime: 0 });
  compressed.writeUInt32LE(0, 4);
  compressed[9] = 255;
  return compressed;
};
const COMPRESSOR_GOLDEN_SHA256 =
  "941a4bc214aa7c64e7774aef050f4e4fc0ed5a45220ebbcccf54a4b00d5314ee";
const COMPRESSOR_INPUT_SHA256 =
  "a8f45e88ab5d8f7d6a500500fbd27e8ecbbed4d7bc0f3dec76d98be7bafd778b";
let compressorVerified = false;
const createCompressorVector = () => {
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

const verifyCompressor = () => {
  if (compressorVerified) return;
  assertSupportedNodeMajor(process.versions.node);
  const vector = createCompressorVector();
  const compressed = normalizedGzip(vector);
  if (
    vector.length !== 23757 ||
    sha256Hex(vector) !== COMPRESSOR_INPUT_SHA256 ||
    compressed.length !== 23785 ||
    sha256Hex(compressed) !== COMPRESSOR_GOLDEN_SHA256
  ) {
    throw new TypeError("Node 22 gzip compressor failed its golden self-check");
  }
  compressorVerified = true;
};
export const assertSupportedNodeMajor = (version) => {
  if (typeof version !== "string" || version.split(".")[0] !== "22") {
    throw new TypeError("deterministic compression requires Node 22");
  }
};
export const deterministicGzip = (bytes) => {
  verifyCompressor();
  return normalizedGzip(bytes);
};
const entryMetadata = ({ path, group, size, compressedSize, sha256 }) => ({
  path,
  group,
  size,
  compressedSize,
  sha256,
});

const deriveVersion = (entries) =>
  `sha256-${sha256Hex(
    canonicalJson({
      schemaVersion: SCHEMA_VERSION,
      entries: entries.map(entryMetadata),
    }),
  )}`;

const validateLogicalPath = (logicalPath) => {
  if (
    typeof logicalPath !== "string" ||
    logicalPath.length === 0 ||
    logicalPath.includes("\0") ||
    logicalPath.includes("\\") ||
    isAbsolute(logicalPath) ||
    posix.normalize(logicalPath) !== logicalPath
  ) {
    throw new TypeError(
      "manifest entry path must be a normalized relative path",
    );
  }
  const match = logicalPath.match(
    /^packages\/geoint\/(region-dist|region-db)\/(.+)$/,
  );
  if (
    !match ||
    match[2].split("/").some((part) => part === "." || part === "..")
  ) {
    throw new TypeError("manifest entry path is outside the managed roots");
  }
  return match[1];
};

const validateEntry = (entry, index) => {
  const label = `manifest entry ${index}`;
  assertExactKeys(
    entry,
    ["path", "group", "size", "compressedSize", "sha256", "objectKey"],
    label,
  );
  const pathGroup = validateLogicalPath(entry.path);
  if (!GROUPS.includes(entry.group) || entry.group !== pathGroup) {
    throw new TypeError(`${label} group does not match its path`);
  }
  for (const field of ["size", "compressedSize"]) {
    if (!Number.isSafeInteger(entry[field]) || entry[field] < 0) {
      throw new TypeError(
        `${label} ${field} must be a non-negative safe integer`,
      );
    }
  }
  if (typeof entry.sha256 !== "string" || !SHA256_PATTERN.test(entry.sha256)) {
    throw new TypeError(`${label} has a malformed SHA-256 hash`);
  }
  if (typeof entry.objectKey !== "string") {
    throw new TypeError(`${label} objectKey must be a string`);
  }
};

export const validateManifest = (manifest) => {
  assertExactKeys(
    manifest,
    ["schemaVersion", "version", "entries"],
    "manifest",
  );
  if (manifest.schemaVersion !== SCHEMA_VERSION) {
    throw new TypeError("unsupported manifest schema version");
  }
  if (
    typeof manifest.version !== "string" ||
    !VERSION_PATTERN.test(manifest.version)
  ) {
    throw new TypeError("unsupported or malformed manifest release version");
  }
  if (!Array.isArray(manifest.entries)) {
    throw new TypeError("manifest entries must be an array");
  }

  const objectMetadata = new Map();
  let previousPath;
  for (const [index, entry] of manifest.entries.entries()) {
    validateEntry(entry, index);
    if (previousPath === entry.path)
      throw new TypeError("duplicate manifest logical path");
    if (
      previousPath !== undefined &&
      compareText(previousPath, entry.path) >= 0
    ) {
      throw new TypeError(
        "manifest entries must use stable logical-path ordering",
      );
    }
    previousPath = entry.path;
    const metadata = `${entry.size}:${entry.compressedSize}`;
    const previousMetadata = objectMetadata.get(entry.sha256);
    if (previousMetadata && previousMetadata !== metadata) {
      throw new TypeError("content object has conflicting size metadata");
    }
    objectMetadata.set(entry.sha256, metadata);
  }

  const expectedVersion = deriveVersion(manifest.entries);
  if (manifest.version !== expectedVersion) {
    throw new TypeError(
      "manifest version does not match its canonical entry metadata",
    );
  }
  for (const entry of manifest.entries) {
    const expectedObjectKey = `releases/${manifest.version}/objects/${entry.sha256}.json.gz`;
    if (entry.objectKey !== expectedObjectKey) {
      throw new TypeError("manifest entry has a malformed object key");
    }
  }
  return manifest;
};

const sourcePath = (sourceRoot) =>
  resolve(sourceRoot instanceof URL ? fileURLToPath(sourceRoot) : sourceRoot);

export const createManifest = async (
  { sourceRoot },
  { beforeDirectoryRead, beforeFileOpen } = {},
) => {
  if (typeof sourceRoot !== "string" && !(sourceRoot instanceof URL)) {
    throw new TypeError("sourceRoot must be a path string or file URL");
  }
  const entries = [];
  await enumerateManagedFiles({
    root: sourcePath(sourceRoot),
    beforeDirectoryRead,
    beforeFileOpen,
    onFile: ({ path, group, contents }) => {
      const compressed = deterministicGzip(contents);
      entries.push({
        path,
        group,
        size: contents.length,
        compressedSize: compressed.length,
        sha256: sha256Hex(contents),
      });
    },
  });
  entries.sort((left, right) => compareText(left.path, right.path));
  const version = deriveVersion(entries);
  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    version,
    entries: entries.map((entry) => ({
      ...entry,
      objectKey: `releases/${version}/objects/${entry.sha256}.json.gz`,
    })),
  };
  return validateManifest(manifest);
};
