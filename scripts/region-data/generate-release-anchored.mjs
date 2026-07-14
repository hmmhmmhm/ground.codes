import { spawn } from "node:child_process";
import { lstat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WORKER = fileURLToPath(
  new URL("./generate-release-fs-worker.mjs", import.meta.url),
);
const missing = (error) => error?.code === "ENOENT";
const sameIdentity = (left, right) =>
  left.dev === right.dev && left.ino === right.ino;

export const directoryIdentity = async (path, label = "directory") => {
  const stats = await lstat(path, { bigint: true });
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new TypeError(`${label} must be a non-symlink directory`);
  }
  return {
    path: resolve(path),
    dev: String(stats.dev),
    ino: String(stats.ino),
  };
};

const assertCurrentIdentity = async (expected, label) => {
  const current = await directoryIdentity(expected.path, label);
  if (!sameIdentity(current, expected)) {
    throw new TypeError(`${label} identity changed`);
  }
};

export const runAnchoredMutation = async ({
  cwd,
  expectedIdentity,
  operation,
  beforeSpawn,
}) => {
  await assertCurrentIdentity(
    { ...expectedIdentity, path: resolve(cwd) },
    "verified parent",
  );
  await beforeSpawn?.();
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [WORKER], {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        try {
          resolvePromise(JSON.parse(Buffer.concat(stdout).toString("utf8")));
        } catch (error) {
          reject(error);
        }
        return;
      }
      reject(
        new TypeError(
          Buffer.concat(stderr).toString("utf8").trim() ||
            "anchored mutation worker failed",
        ),
      );
    });
    child.stdin.end(
      JSON.stringify({
        expectedIdentity: {
          dev: expectedIdentity.dev,
          ino: expectedIdentity.ino,
        },
        operation,
      }),
    );
  });
};

export const ensureAnchoredDirectory = async (path, label = "directory") => {
  const absolute = resolve(path);
  try {
    return await directoryIdentity(absolute, label);
  } catch (error) {
    if (!missing(error)) throw error;
  }
  const parentPath = dirname(absolute);
  if (parentPath === absolute)
    throw new TypeError(`${label} has no directory parent`);
  const parent = await ensureAnchoredDirectory(parentPath, `${label} parent`);
  const result = await runAnchoredMutation({
    cwd: parent.path,
    expectedIdentity: parent,
    operation: { type: "mkdir", name: basename(absolute), mode: 0o755 },
  });
  return { path: absolute, ...result.identity };
};

export const ensureAnchoredChild = async (
  parent,
  name,
  label,
  { exclusive = false, mode = 0o755 } = {},
) => {
  const result = await runAnchoredMutation({
    cwd: parent.path,
    expectedIdentity: parent,
    operation: { type: "mkdir", name, mode, exclusive },
  });
  return { path: join(parent.path, name), ...result.identity };
};

export const optionalAnchoredChild = async (parent, name, label) => {
  const result = await runAnchoredMutation({
    cwd: parent.path,
    expectedIdentity: parent,
    operation: { type: "inspect-directory", name },
  });
  return result.missing
    ? null
    : { path: join(parent.path, name), ...result.identity, label };
};

export const writeAnchoredFile = (
  parent,
  name,
  bytes,
  { immutable, writtenEvent, directoryFsyncPhase, failDurabilityPhase },
) =>
  runAnchoredMutation({
    cwd: parent.path,
    expectedIdentity: parent,
    operation: {
      type: "write-file",
      name,
      bytes: Buffer.from(bytes).toString("base64"),
      immutable,
      writtenEvent,
      directoryFsyncPhase,
      failDurabilityPhase,
    },
  });

export const promoteAnchoredChild = (parent, source, destination, identity) =>
  runAnchoredMutation({
    cwd: parent.path,
    expectedIdentity: parent,
    operation: {
      type: "rename",
      source,
      destination,
      sourceIdentity: { dev: identity.dev, ino: identity.ino },
    },
  });

export const removeOwnedAnchoredChild = (parent, name, identity) =>
  runAnchoredMutation({
    cwd: parent.path,
    expectedIdentity: parent,
    operation: {
      type: "remove-owned",
      name,
      identity: { dev: identity.dev, ino: identity.ino },
    },
  });

export const listPrivateAnchoredChildren = (parent) =>
  runAnchoredMutation({
    cwd: parent.path,
    expectedIdentity: parent,
    operation: { type: "list-private-directories" },
  });
