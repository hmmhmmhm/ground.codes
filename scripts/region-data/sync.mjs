import { constants } from "node:fs";
import { lstat, open } from "node:fs/promises";
import { resolve } from "node:path";

import { readResponseBytes, requestWithRetry } from "./sync-http.mjs";
import {
  localEntryMatches,
  materializeResponse,
  prepareEntryDestination,
  prepareMaterializationRoot,
  pruneManagedGroups,
} from "./sync-filesystem.mjs";
import { canonicalJson, sha256Hex, validateManifest } from "./manifest.mjs";

const HASH_PATTERN = /^[a-f0-9]{64}$/;
const VERSION_PATTERN = /^sha256-[a-f0-9]{64}$/;
const GROUPS = new Set(["region-dist", "region-db"]);
const READ_FLAGS =
  constants.O_RDONLY |
  (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);
const sameIdentity = (left, right) =>
  left.dev === right.dev && left.ino === right.ino;

const assertExactKeys = (value, expected, label) => {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new TypeError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    throw new TypeError(`${label} has unsupported fields`);
  }
};

const readPointer = async (pointerPath) => {
  const path = resolve(pointerPath);
  const stats = await lstat(path, { bigint: true });
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw new TypeError("release pointer must be a regular file");
  }
  let bytes;
  const handle = await open(path, READ_FLAGS);
  try {
    const opened = await handle.stat({ bigint: true });
    if (!opened.isFile() || !sameIdentity(opened, stats)) {
      throw new TypeError("release pointer changed before secure read");
    }
    bytes = await handle.readFile();
  } finally {
    await handle.close();
  }
  const after = await lstat(path, { bigint: true });
  if (
    after.isSymbolicLink() ||
    !after.isFile() ||
    !sameIdentity(after, stats)
  ) {
    throw new TypeError("release pointer changed during secure read");
  }
  let pointer;
  try {
    pointer = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new TypeError(
      `release pointer is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  assertExactKeys(
    pointer,
    ["schemaVersion", "version", "manifestSha256"],
    "release pointer",
  );
  if (pointer.schemaVersion !== 1) {
    throw new TypeError("unsupported release pointer schema version");
  }
  if (!VERSION_PATTERN.test(pointer.version)) {
    throw new TypeError("release pointer has a malformed version");
  }
  if (!HASH_PATTERN.test(pointer.manifestSha256)) {
    throw new TypeError("release pointer has a malformed manifest hash");
  }
  if (!bytes.equals(Buffer.from(canonicalJson(pointer)))) {
    throw new TypeError("release pointer is not canonical JSON");
  }
  return pointer;
};

const baseUrlFor = (value) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError("REGION_DATA_BASE_URL is required");
  }
  const url = new URL(value.endsWith("/") ? value : `${value}/`);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new TypeError("region-data base URL must be a plain HTTP(S) origin");
  }
  return url;
};

const validateScope = ({ groups, paths, prune }) => {
  const hasGroups = Array.isArray(groups) && groups.length > 0;
  const hasPaths = Array.isArray(paths) && paths.length > 0;
  if (hasGroups === hasPaths) {
    throw new TypeError("select either groups or explicit paths");
  }
  if (hasGroups) {
    const selected = [...new Set(groups)];
    if (selected.some((group) => !GROUPS.has(group))) {
      throw new TypeError("sync groups must be region-dist or region-db");
    }
    return { groups: selected, paths: null };
  }
  if (prune) throw new TypeError("prune is not allowed with explicit paths");
  const selected = [...new Set(paths)];
  if (
    selected.some(
      (path) =>
        typeof path !== "string" ||
        !/^packages\/geoint\/(region-dist|region-db)\/[^\\]+$/.test(path) ||
        path.includes("\0") ||
        path.includes("\\") ||
        path.split("/").some((part) => part === "." || part === ".."),
    )
  ) {
    throw new TypeError("explicit sync path is outside managed roots");
  }
  return { groups: null, paths: selected };
};

const selectEntries = (manifest, scope) => {
  if (scope.groups) {
    const groups = new Set(scope.groups);
    return manifest.entries.filter((entry) => groups.has(entry.group));
  }
  const byPath = new Map(manifest.entries.map((entry) => [entry.path, entry]));
  return scope.paths.map((path) => {
    const entry = byPath.get(path);
    if (!entry) throw new TypeError(`explicit sync path is absent: ${path}`);
    return entry;
  });
};

const mapLimit = async (values, concurrency, worker) => {
  if (
    !Number.isSafeInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 32
  ) {
    throw new TypeError("sync concurrency must be an integer from 1 to 32");
  }
  let next = 0;
  const results = new Array(values.length);
  const run = async () => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= values.length) return;
      results[index] = await worker(values[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, run),
  );
  return results;
};

const fetchManifest = async ({ pointer, baseUrl, requestOptions }) => {
  const path = `releases/${pointer.version}/manifest.json`;
  const bytes = await requestWithRetry(
    new URL(path, baseUrl),
    (response) => readResponseBytes(response, "release manifest"),
    requestOptions,
  );
  if (sha256Hex(bytes) !== pointer.manifestSha256) {
    throw new TypeError("release manifest hash does not match the pointer");
  }
  let manifest;
  try {
    manifest = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new TypeError("release manifest is not valid JSON");
  }
  validateManifest(manifest);
  if (manifest.version !== pointer.version) {
    throw new TypeError("release manifest version does not match the pointer");
  }
  if (!bytes.equals(Buffer.from(canonicalJson(manifest)))) {
    throw new TypeError("release manifest is not canonical JSON");
  }
  return manifest;
};

export const syncRegionData = async ({
  root,
  pointerPath,
  baseUrl,
  groups,
  paths,
  prune = false,
  concurrency = 4,
  attempts = 3,
  retryDelayMs = 100,
  fetchImpl,
}) => {
  const pointer = await readPointer(pointerPath);
  const scope = validateScope({ groups, paths, prune });
  const base = baseUrlFor(baseUrl);
  const requestOptions = { attempts, retryDelayMs, fetchImpl };
  const manifest = await fetchManifest({
    pointer,
    baseUrl: base,
    requestOptions,
  });
  const selected = selectEntries(manifest, scope);
  const materializationRoot = await prepareMaterializationRoot(root);
  const results = await mapLimit(selected, concurrency, async (entry) => {
    const destination = await prepareEntryDestination(
      materializationRoot,
      entry.path,
    );
    if (await localEntryMatches(destination, entry)) {
      return { downloaded: 0, skipped: 1, bytes: 0 };
    }
    const materialized = await requestWithRetry(
      new URL(entry.objectKey, base),
      (response) => materializeResponse({ destination, entry, response }),
      requestOptions,
    );
    return { downloaded: 1, skipped: 0, bytes: materialized.bytes };
  });
  const totals = results.reduce(
    (sum, result) => ({
      bytes: sum.bytes + result.bytes,
      downloaded: sum.downloaded + result.downloaded,
      skipped: sum.skipped + result.skipped,
    }),
    { bytes: 0, downloaded: 0, skipped: 0 },
  );
  let pruned = 0;
  if (prune) {
    pruned = await pruneManagedGroups({
      root: materializationRoot,
      groups: scope.groups,
      desired: new Set(manifest.entries.map((entry) => entry.path)),
    });
  }
  return {
    version: manifest.version,
    selected: selected.length,
    ...totals,
    pruned,
  };
};
