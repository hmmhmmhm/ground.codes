import { createHash, randomUUID } from "node:crypto";
import { constants, createReadStream, createWriteStream } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  rename,
  rm,
  unlink,
} from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

const READ_FLAGS =
  constants.O_RDONLY |
  (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);
const WRITE_FLAGS =
  constants.O_WRONLY |
  constants.O_CREAT |
  constants.O_EXCL |
  (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);
const sameIdentity = (left, right) =>
  left.dev === right.dev && left.ino === right.ino;
const missing = (error) => error?.code === "ENOENT";

const assertContained = (root, target, label) => {
  const fromRoot = relative(root, target);
  if (
    fromRoot === ".." ||
    fromRoot.startsWith(`..${sep}`) ||
    isAbsolute(fromRoot)
  ) {
    throw new TypeError(`${label} escapes the materialization root`);
  }
};

const inspectDirectory = async (path, label, canonicalRoot) => {
  const stats = await lstat(path, { bigint: true });
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new TypeError(`${label} must be a non-symlink directory`);
  }
  const canonical = await realpath(path);
  if (canonicalRoot) assertContained(canonicalRoot, canonical, label);
  return { canonical, stats };
};

export const prepareMaterializationRoot = async (rootValue) => {
  if (typeof rootValue !== "string" || rootValue.length === 0) {
    throw new TypeError("materialization root must be a non-empty path");
  }
  const root = resolve(rootValue);
  await mkdir(root, { recursive: true });
  const inspected = await inspectDirectory(root, "materialization root");
  return { path: root, canonical: inspected.canonical, stats: inspected.stats };
};

const ensureDirectory = async (path, label, root) => {
  try {
    await mkdir(path);
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }
  return inspectDirectory(path, label, root.canonical);
};

export const prepareEntryDestination = async (root, logicalPath) => {
  const parts = logicalPath.split("/");
  let current = root.path;
  for (const part of parts.slice(0, -1)) {
    current = join(current, part);
    await ensureDirectory(current, `${part} directory`, root);
  }
  const destination = join(current, parts.at(-1));
  assertContained(root.path, destination, "entry destination");
  return destination;
};

const hashRegularFile = async (path, label) => {
  let before;
  try {
    before = await lstat(path, { bigint: true });
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
  if (before.isSymbolicLink() || !before.isFile()) {
    throw new TypeError(`${label} must be a regular file when present`);
  }
  const hash = createHash("sha256");
  let size = 0;
  const stream = createReadStream(path, { flags: READ_FLAGS });
  for await (const chunk of stream) {
    hash.update(chunk);
    size += chunk.length;
  }
  const after = await lstat(path, { bigint: true });
  if (
    after.isSymbolicLink() ||
    !after.isFile() ||
    !sameIdentity(before, after) ||
    before.size !== after.size
  ) {
    throw new TypeError(`${label} changed during local verification`);
  }
  return { sha256: hash.digest("hex"), size };
};

export const localEntryMatches = async (destination, entry) => {
  const local = await hashRegularFile(destination, entry.path);
  return local?.size === entry.size && local.sha256 === entry.sha256;
};

const fsyncDirectory = async (path) => {
  const handle = await open(path, constants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
};

export const materializeResponse = async ({ destination, entry, response }) => {
  if (!response.body) throw new TypeError(`${entry.path} response has no body`);
  const temporary = join(
    dirname(destination),
    `.${basename(destination)}.region-sync-${randomUUID()}.tmp`,
  );
  const hash = createHash("sha256");
  let size = 0;
  const measure = new Transform({
    transform(chunk, _encoding, callback) {
      size += chunk.length;
      if (size > entry.size) {
        callback(new TypeError(`${entry.path} exceeds its declared size`));
        return;
      }
      hash.update(chunk);
      callback(null, chunk);
    },
  });
  try {
    await pipeline(
      Readable.fromWeb(response.body),
      createGunzip(),
      measure,
      createWriteStream(temporary, { flags: WRITE_FLAGS, mode: 0o600 }),
    );
    const digest = hash.digest("hex");
    if (size !== entry.size || digest !== entry.sha256) {
      throw new TypeError(`${entry.path} failed size or hash integrity`);
    }
    const handle = await open(temporary, READ_FLAGS);
    try {
      await handle.sync();
      await handle.chmod(0o644);
      await handle.sync();
    } finally {
      await handle.close();
    }
    let current;
    try {
      current = await lstat(destination);
    } catch (error) {
      if (!missing(error)) throw error;
    }
    if (current && (current.isSymbolicLink() || !current.isFile())) {
      throw new TypeError(`${entry.path} destination is not a regular file`);
    }
    await rename(temporary, destination);
    await fsyncDirectory(dirname(destination));
    return { bytes: size };
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => {});
    if (error?.code === "Z_BUF_ERROR" || error?.code === "Z_DATA_ERROR") {
      throw new TypeError(`${entry.path} gzip decompression failed`);
    }
    throw error;
  }
};

const walkForPrune = async ({ directory, root, desired, logicalPrefix }) => {
  let pruned = 0;
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (missing(error)) return 0;
    throw error;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    const logicalPath = `${logicalPrefix}/${entry.name}`;
    const stats = await lstat(path);
    if (stats.isSymbolicLink()) {
      throw new TypeError(`${logicalPath} is a symlink during prune`);
    }
    if (stats.isDirectory()) {
      pruned += await walkForPrune({
        directory: path,
        root,
        desired,
        logicalPrefix: logicalPath,
      });
      continue;
    }
    if (!stats.isFile()) {
      throw new TypeError(`${logicalPath} is not a regular managed file`);
    }
    if (desired.has(logicalPath)) continue;
    assertContained(root.canonical, await realpath(path), logicalPath);
    await unlink(path);
    await fsyncDirectory(directory);
    pruned += 1;
  }
  return pruned;
};

export const pruneManagedGroups = async ({ root, groups, desired }) => {
  let pruned = 0;
  for (const group of groups) {
    const logicalPrefix = `packages/geoint/${group}`;
    const directory = join(root.path, ...logicalPrefix.split("/"));
    pruned += await walkForPrune({
      directory,
      root,
      desired,
      logicalPrefix,
    });
  }
  return pruned;
};
