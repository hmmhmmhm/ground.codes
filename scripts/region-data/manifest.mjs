import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isAbsolute, join, posix, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const SCHEMA_VERSION = 1;
const LOGICAL_ROOT = "packages/geoint";
const GROUPS = ["region-dist", "region-db"];
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

export const deterministicGzip = (bytes) => {
  const compressed = gzipSync(bytes, { level: 9, mtime: 0 });
  compressed.writeUInt32LE(0, 4);
  compressed[9] = 255;
  return compressed;
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

  const paths = new Set();
  let previousPath;
  for (const [index, entry] of manifest.entries.entries()) {
    validateEntry(entry, index);
    if (paths.has(entry.path))
      throw new TypeError("duplicate manifest logical path");
    if (
      previousPath !== undefined &&
      compareText(previousPath, entry.path) >= 0
    ) {
      throw new TypeError(
        "manifest entries must use stable logical-path ordering",
      );
    }
    paths.add(entry.path);
    previousPath = entry.path;
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

const enumerateGroup = async ({ root, group }) => {
  const entries = [];
  const visit = async (relativeDirectory) => {
    const directoryPath = join(root, group, ...relativeDirectory);
    const directoryStats = await lstat(directoryPath);
    if (directoryStats.isSymbolicLink() || !directoryStats.isDirectory()) {
      throw new TypeError(
        `${group}/${relativeDirectory.join("/")} must be a directory`,
      );
    }
    const children = await readdir(directoryPath, { withFileTypes: true });
    children.sort((left, right) => compareText(left.name, right.name));
    for (const child of children) {
      const relativeParts = [...relativeDirectory, child.name];
      const logicalPath = `${LOGICAL_ROOT}/${group}/${relativeParts.join("/")}`;
      const absolutePath = join(root, group, ...relativeParts);
      const stats = await lstat(absolutePath);
      if (stats.isSymbolicLink()) {
        throw new TypeError(`${logicalPath} is a symlink, not a regular file`);
      }
      if (stats.isDirectory()) {
        await visit(relativeParts);
        continue;
      }
      if (!stats.isFile()) {
        throw new TypeError(`${logicalPath} is not a regular file`);
      }
      const contents = await readFile(absolutePath);
      const compressed = deterministicGzip(contents);
      entries.push({
        path: logicalPath,
        group,
        size: contents.length,
        compressedSize: compressed.length,
        sha256: sha256Hex(contents),
      });
    }
  };
  await visit([]);
  return entries;
};

export const createManifest = async ({ sourceRoot }) => {
  if (typeof sourceRoot !== "string" && !(sourceRoot instanceof URL)) {
    throw new TypeError("sourceRoot must be a path string or file URL");
  }
  const root = sourcePath(sourceRoot);
  const rootStats = await lstat(root);
  if (rootStats.isSymbolicLink()) {
    throw new TypeError("sourceRoot must not be a symlink");
  }
  if (!rootStats.isDirectory()) {
    throw new TypeError("sourceRoot must be a directory");
  }
  const entries = (
    await Promise.all(GROUPS.map((group) => enumerateGroup({ root, group })))
  )
    .flat()
    .sort((left, right) => compareText(left.path, right.path));
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
