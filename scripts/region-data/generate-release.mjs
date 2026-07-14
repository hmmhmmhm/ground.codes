import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

import { enumerateManagedFiles } from "./manifest-filesystem.mjs";
import {
  canonicalJson,
  createManifest,
  deterministicGzip,
  sha256Hex,
  validateManifest,
} from "./manifest.mjs";

const READ_FLAGS =
  constants.O_RDONLY |
  (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);
const WRITE_FLAGS = constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL;

const toPath = (value, label) => {
  if (
    (typeof value !== "string" && !(value instanceof URL)) ||
    value.length === 0
  ) {
    throw new TypeError(`${label} must be a path string or file URL`);
  }
  return resolve(value instanceof URL ? fileURLToPath(value) : value);
};

const missing = (error) => error?.code === "ENOENT";
const sameIdentity = (left, right) =>
  left.dev === right.dev && left.ino === right.ino;

const assertContained = (root, target, label) => {
  const fromRoot = relative(root, target);
  if (
    fromRoot === ".." ||
    fromRoot.startsWith(`..${sep}`) ||
    isAbsolute(fromRoot)
  ) {
    throw new TypeError(`${label} escapes the staging root`);
  }
};

const inspectDirectory = async (path, label, canonicalRoot) => {
  const stats = await lstat(path, { bigint: true });
  if (stats.isSymbolicLink()) {
    throw new TypeError(`${label} must not be a symlink`);
  }
  if (!stats.isDirectory()) {
    throw new TypeError(`${label} must be a directory`);
  }
  const canonical = await realpath(path);
  if (canonicalRoot) assertContained(canonicalRoot, canonical, label);
  return { path, label, stats, canonical };
};

const assertDirectoryGuard = async (guard, canonicalRoot) => {
  const current = await inspectDirectory(
    guard.path,
    guard.label,
    canonicalRoot,
  );
  if (!sameIdentity(current.stats, guard.stats)) {
    throw new TypeError(`${guard.label} changed during release generation`);
  }
};

const ensureStagingRoot = async (path) => {
  await mkdir(path, { recursive: true });
  return inspectDirectory(path, "staging root");
};

const ensureChildDirectory = async (
  parentGuard,
  name,
  canonicalRoot,
  label,
) => {
  await assertDirectoryGuard(parentGuard, canonicalRoot);
  const path = join(parentGuard.path, name);
  try {
    await mkdir(path);
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }
  const guard = await inspectDirectory(path, label, canonicalRoot);
  await assertDirectoryGuard(parentGuard, canonicalRoot);
  return guard;
};

const readRegularFile = async (path, label) => {
  let inspected;
  try {
    inspected = await lstat(path, { bigint: true });
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
  if (inspected.isSymbolicLink() || !inspected.isFile()) {
    throw new TypeError(`${label} must be a regular file`);
  }
  let handle;
  try {
    handle = await open(path, READ_FLAGS);
    const opened = await handle.stat({ bigint: true });
    if (!opened.isFile() || !sameIdentity(inspected, opened)) {
      throw new TypeError(`${label} changed before secure read`);
    }
    const bytes = await handle.readFile();
    const after = await lstat(path, { bigint: true });
    if (
      after.isSymbolicLink() ||
      !after.isFile() ||
      !sameIdentity(opened, after)
    ) {
      throw new TypeError(`${label} changed during secure read`);
    }
    return bytes;
  } finally {
    await handle?.close();
  }
};

const writeImmutableArtifact = async ({ path, bytes, label, guards, root }) => {
  for (const guard of guards) await assertDirectoryGuard(guard, root);
  const existing = await readRegularFile(path, label);
  if (existing) {
    if (!existing.equals(bytes)) {
      throw new TypeError(`${label} is a conflicting immutable artifact`);
    }
    return false;
  }

  let handle;
  let created = false;
  try {
    try {
      handle = await open(path, WRITE_FLAGS, 0o644);
      created = true;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const raced = await readRegularFile(path, label);
      if (!raced?.equals(bytes)) {
        throw new TypeError(`${label} is a conflicting immutable artifact`);
      }
      return false;
    }
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = undefined;
    for (const guard of guards) await assertDirectoryGuard(guard, root);
    return true;
  } catch (error) {
    await handle?.close().catch(() => {});
    if (created) await rm(path, { force: true }).catch(() => {});
    throw error;
  }
};

const writePointer = async (path, bytes) => {
  await mkdir(dirname(path), { recursive: true });
  const existing = await readRegularFile(path, "release pointer");
  if (existing?.equals(bytes)) return;

  const temporary = join(dirname(path), `.${randomUUID()}.tmp`);
  let handle;
  try {
    handle = await open(temporary, WRITE_FLAGS, 0o644);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = undefined;
    if (existing) await readRegularFile(path, "release pointer");
    await rename(temporary, path);
  } catch (error) {
    await handle?.close().catch(() => {});
    await rm(temporary, { force: true }).catch(() => {});
    throw error;
  }
};

export const generateRelease = async ({
  sourceRoot: sourceValue,
  stagingRoot: stagingValue,
  pointerPath: pointerValue,
}) => {
  const sourceRoot = toPath(sourceValue, "sourceRoot");
  const stagingRoot = toPath(stagingValue, "stagingRoot");
  const pointerPath = toPath(pointerValue, "pointerPath");
  const manifest = validateManifest(await createManifest({ sourceRoot }));
  const manifestBytes = Buffer.from(canonicalJson(manifest));
  const manifestSha256 = sha256Hex(manifestBytes);

  const stagingGuard = await ensureStagingRoot(stagingRoot);
  const canonicalRoot = stagingGuard.canonical;
  const releasesGuard = await ensureChildDirectory(
    stagingGuard,
    "releases",
    canonicalRoot,
    "releases directory",
  );
  const releaseGuard = await ensureChildDirectory(
    releasesGuard,
    manifest.version,
    canonicalRoot,
    "release directory",
  );
  const objectsGuard = await ensureChildDirectory(
    releaseGuard,
    "objects",
    canonicalRoot,
    "release objects directory",
  );
  const objectGuards = [
    stagingGuard,
    releasesGuard,
    releaseGuard,
    objectsGuard,
  ];
  const entries = new Map(manifest.entries.map((entry) => [entry.path, entry]));
  const visitedPaths = new Set();
  const writtenHashes = new Set();
  let createdObjects = 0;

  await enumerateManagedFiles({
    root: sourceRoot,
    onFile: async ({ path, group, contents }) => {
      const expected = entries.get(path);
      const hash = sha256Hex(contents);
      if (
        !expected ||
        expected.group !== group ||
        expected.size !== contents.length ||
        expected.sha256 !== hash
      ) {
        throw new TypeError(`${path} changed after manifest creation`);
      }
      visitedPaths.add(path);
      if (writtenHashes.has(hash)) return;
      const compressed = deterministicGzip(contents);
      if (compressed.length !== expected.compressedSize) {
        throw new TypeError(
          `${path} compression changed after manifest creation`,
        );
      }
      const objectPath = resolve(stagingRoot, expected.objectKey);
      assertContained(stagingRoot, objectPath, "content object path");
      if (
        await writeImmutableArtifact({
          path: objectPath,
          bytes: compressed,
          label: `content object ${hash}`,
          guards: objectGuards,
          root: canonicalRoot,
        })
      ) {
        createdObjects += 1;
      }
      writtenHashes.add(hash);
    },
  });
  if (visitedPaths.size !== entries.size) {
    throw new TypeError("source entries changed after manifest creation");
  }

  const manifestPath = join(releaseGuard.path, "manifest.json");
  await writeImmutableArtifact({
    path: manifestPath,
    bytes: manifestBytes,
    label: "release manifest",
    guards: [stagingGuard, releasesGuard, releaseGuard],
    root: canonicalRoot,
  });
  const pointerBytes = Buffer.from(
    canonicalJson({
      schemaVersion: 1,
      version: manifest.version,
      manifestSha256,
    }),
  );
  await writePointer(pointerPath, pointerBytes);

  return {
    version: manifest.version,
    manifestSha256,
    entryCount: manifest.entries.length,
    objectCount: writtenHashes.size,
    createdObjects,
  };
};
