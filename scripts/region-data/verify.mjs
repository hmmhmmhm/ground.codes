import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  canonicalJson,
  createManifest,
  validateManifest,
} from "./manifest.mjs";

const GROUPS = ["region-dist", "region-db"];
const READ_FLAGS =
  constants.O_RDONLY |
  (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);
const missing = (error) => error?.code === "ENOENT";
const sameIdentity = (left, right) =>
  left.dev === right.dev && left.ino === right.ino;

const loadManifest = async (manifestPath) => {
  const path = resolve(manifestPath);
  const before = await lstat(path, { bigint: true });
  if (before.isSymbolicLink() || !before.isFile()) {
    throw new TypeError("manifestPath must be a regular file");
  }
  const handle = await open(path, READ_FLAGS);
  let bytes;
  try {
    const opened = await handle.stat({ bigint: true });
    if (!opened.isFile() || !sameIdentity(before, opened)) {
      throw new TypeError("manifest changed before secure read");
    }
    bytes = await handle.readFile();
  } finally {
    await handle.close();
  }
  const after = await lstat(path, { bigint: true });
  if (!after.isFile() || !sameIdentity(before, after)) {
    throw new TypeError("manifest changed during secure read");
  }
  let manifest;
  try {
    manifest = validateManifest(JSON.parse(bytes.toString("utf8")));
  } catch (error) {
    throw new TypeError(
      `manifest is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (!bytes.equals(Buffer.from(canonicalJson(manifest)))) {
    throw new TypeError("manifest is not canonical JSON");
  }
  return manifest;
};

const inspectMaterializedFile = async (path, expected) => {
  let before;
  try {
    before = await lstat(path, { bigint: true });
  } catch (error) {
    return missing(error) ? "missing" : "unreadable";
  }
  if (before.isSymbolicLink() || !before.isFile()) return "unreadable";
  let handle;
  try {
    handle = await open(path, READ_FLAGS);
    const opened = await handle.stat({ bigint: true });
    if (!opened.isFile() || !sameIdentity(before, opened)) {
      return "unreadable";
    }
    const hash = createHash("sha256");
    let size = 0;
    for await (const chunk of handle.createReadStream({ autoClose: false })) {
      size += chunk.length;
      hash.update(chunk);
    }
    const after = await lstat(path, { bigint: true });
    if (
      after.isSymbolicLink() ||
      !after.isFile() ||
      !sameIdentity(opened, after) ||
      opened.size !== after.size
    ) {
      return "unreadable";
    }
    return size === expected.size && hash.digest("hex") === expected.sha256
      ? "matching"
      : "changed";
  } catch {
    return "unreadable";
  } finally {
    await handle?.close().catch(() => {});
  }
};

const listManagedFiles = async (materializedRoot) => {
  const files = [];
  const unreadable = [];
  const visit = async (directory, logicalPrefix) => {
    let children;
    try {
      children = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (missing(error)) return;
      unreadable.push(logicalPrefix);
      return;
    }
    children.sort((left, right) => left.name.localeCompare(right.name));
    for (const child of children) {
      const path = join(directory, child.name);
      const logicalPath = `${logicalPrefix}/${child.name}`;
      let stats;
      try {
        stats = await lstat(path);
      } catch {
        unreadable.push(logicalPath);
        continue;
      }
      if (stats.isSymbolicLink()) {
        unreadable.push(logicalPath);
      } else if (stats.isDirectory()) {
        await visit(path, logicalPath);
      } else if (stats.isFile()) {
        files.push(logicalPath);
      } else {
        unreadable.push(logicalPath);
      }
    }
  };
  for (const group of GROUPS) {
    const logicalPrefix = `packages/geoint/${group}`;
    await visit(
      join(materializedRoot, ...logicalPrefix.split("/")),
      logicalPrefix,
    );
  }
  return { files, unreadable };
};

const emptyMismatches = () => ({
  missing: [],
  extra: [],
  changed: [],
  unreadable: [],
});

export const formatVerificationResult = (result) =>
  [
    "verified",
    `ok=${Number(result.ok)}`,
    `version=${result.version}`,
    `entries=${result.entryCount}`,
    `region-dist=${result.groupCounts["region-dist"]}`,
    `region-db=${result.groupCounts["region-db"]}`,
    `bytes=${result.bytes}`,
    `missing=${result.mismatches.missing.length}`,
    `extra=${result.mismatches.extra.length}`,
    `changed=${result.mismatches.changed.length}`,
    `unreadable=${result.mismatches.unreadable.length}`,
  ].join(" ");

export const verifyRegionData = async ({
  sourceRoot,
  manifestPath,
  materializedRoot,
  exact = false,
}) => {
  const hasSource = typeof sourceRoot === "string" && sourceRoot.length > 0;
  const hasManifest =
    typeof manifestPath === "string" && manifestPath.length > 0;
  if (hasSource === hasManifest) {
    throw new TypeError("provide exactly one of sourceRoot or manifestPath");
  }
  if (typeof materializedRoot !== "string" || materializedRoot.length === 0) {
    throw new TypeError("materializedRoot is required");
  }
  const manifest = hasSource
    ? await createManifest({ sourceRoot })
    : await loadManifest(manifestPath);
  const root = resolve(materializedRoot);
  const mismatches = emptyMismatches();
  for (const entry of manifest.entries) {
    const status = await inspectMaterializedFile(
      join(root, ...entry.path.split("/")),
      entry,
    );
    if (status !== "matching") mismatches[status].push(entry.path);
  }
  if (exact) {
    const expectedPaths = new Set(manifest.entries.map((entry) => entry.path));
    const actual = await listManagedFiles(root);
    mismatches.extra.push(
      ...actual.files.filter((path) => !expectedPaths.has(path)),
    );
    mismatches.unreadable.push(...actual.unreadable);
  }
  for (const [kind, paths] of Object.entries(mismatches)) {
    mismatches[kind] = [...new Set(paths)].sort();
  }
  const groupCounts = Object.fromEntries(
    GROUPS.map((group) => [
      group,
      manifest.entries.filter((entry) => entry.group === group).length,
    ]),
  );
  return {
    ok: Object.values(mismatches).every((paths) => paths.length === 0),
    version: manifest.version,
    entryCount: manifest.entries.length,
    groupCounts,
    bytes: manifest.entries.reduce((sum, entry) => sum + entry.size, 0),
    mismatches,
  };
};
