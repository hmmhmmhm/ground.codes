import { randomUUID } from "node:crypto";
import {
  constants,
  closeSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import { fsyncDirectory } from "./generate-release-durability.mjs";

const readInput = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const identity = (stats) => ({
  dev: String(stats.dev),
  ino: String(stats.ino),
});
const sameIdentity = (stats, expected) =>
  String(stats.dev) === expected.dev && String(stats.ino) === expected.ino;
const inspectDirectory = (path, label) => {
  const stats = lstatSync(path, { bigint: true });
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new TypeError(`${label} is not a verified directory`);
  }
  return stats;
};
const inspectOwned = (name, expected, label) => {
  const stats = lstatSync(name, { bigint: true });
  if (stats.isSymbolicLink() || !sameIdentity(stats, expected)) {
    throw new TypeError(`${label} identity changed`);
  }
  return stats;
};
const validateName = (name, label) => {
  if (
    typeof name !== "string" ||
    name.length === 0 ||
    name === "." ||
    name === ".." ||
    name.includes("/") ||
    name.includes("\\") ||
    name.includes("\0")
  ) {
    throw new TypeError(`${label} must be one relative path segment`);
  }
  return name;
};
const missing = (error) => error?.code === "ENOENT";
const absent = (path) => {
  try {
    lstatSync(path);
    return false;
  } catch (error) {
    if (missing(error)) return true;
    throw error;
  }
};

const readRegular = (name, label) => {
  let inspected;
  try {
    inspected = lstatSync(name, { bigint: true });
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
  if (inspected.isSymbolicLink() || !inspected.isFile()) {
    throw new TypeError(`${label} must be a regular file`);
  }
  const flags =
    constants.O_RDONLY |
    (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);
  const descriptor = openSync(name, flags);
  try {
    const bytes = readFileSync(descriptor);
    const after = lstatSync(name, { bigint: true });
    if (!after.isFile() || !sameIdentity(after, identity(inspected))) {
      throw new TypeError(`${label} identity changed during read`);
    }
    return bytes;
  } finally {
    closeSync(descriptor);
  }
};

const writeAnchoredFile = (operation) => {
  const { name, bytes, immutable } = operation;
  const label = immutable ? "immutable artifact" : "release pointer";
  const destination = validateName(name, label);
  const contents = Buffer.from(bytes, "base64");
  const existing = readRegular(destination, label);
  if (existing?.equals(contents))
    return { created: false, durabilityEvents: [] };
  if (immutable && existing) {
    throw new TypeError(`${label} is conflicting`);
  }
  if (immutable) {
    let descriptor;
    try {
      descriptor = openSync(
        destination,
        constants.O_WRONLY |
          constants.O_CREAT |
          constants.O_EXCL |
          (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0),
        0o600,
      );
      writeFileSync(descriptor, contents);
      fsyncSync(descriptor);
      closeSync(descriptor);
      descriptor = undefined;
      const events = [operation.writtenEvent ?? "immutable-file-written"];
      fsyncDirectory(".", operation.directoryFsyncPhase, {
        failPhase: operation.failDurabilityPhase,
        events,
      });
      return { created: true, durabilityEvents: events };
    } catch (error) {
      try {
        if (descriptor !== undefined) closeSync(descriptor);
      } catch {}
      if (error?.code !== "EEXIST") throw error;
      const raced = readRegular(destination, label);
      if (!raced?.equals(contents))
        throw new TypeError(`${label} is conflicting`);
      return { created: false, durabilityEvents: [] };
    }
  }
  const temporary = validateName(`.write-${randomUUID()}`, "temporary file");
  const descriptor = openSync(
    temporary,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL,
    0o600,
  );
  let owned = true;
  try {
    writeFileSync(descriptor, contents);
    fsyncSync(descriptor);
    closeSync(descriptor);
    readRegular(destination, label);
    renameSync(temporary, destination);
    owned = false;
    const events = [operation.writtenEvent ?? "pointer-renamed"];
    fsyncDirectory(".", operation.directoryFsyncPhase, {
      failPhase: operation.failDurabilityPhase,
      events,
    });
    return { created: true, durabilityEvents: events };
  } finally {
    try {
      closeSync(descriptor);
    } catch {}
    if (owned) rmSync(temporary, { force: true });
  }
};

const mutate = (operation) => {
  if (operation.type === "mkdir") {
    const name = validateName(operation.name, "directory name");
    try {
      mkdirSync(name, { mode: operation.mode });
      return {
        created: true,
        identity: identity(inspectDirectory(name, name)),
      };
    } catch (error) {
      if (error?.code !== "EEXIST" || operation.exclusive) throw error;
      return {
        created: false,
        identity: identity(inspectDirectory(name, name)),
      };
    }
  }
  if (operation.type === "rename") {
    const source = validateName(operation.source, "rename source");
    const destination = validateName(
      operation.destination,
      "rename destination",
    );
    inspectOwned(source, operation.sourceIdentity, "rename source");
    if (!absent(destination))
      throw new TypeError("rename destination already exists");
    renameSync(source, destination);
    inspectOwned(destination, operation.sourceIdentity, "renamed release");
    return { identity: operation.sourceIdentity };
  }
  if (operation.type === "remove-owned") {
    const name = validateName(operation.name, "cleanup source");
    inspectOwned(name, operation.identity, "cleanup source");
    const quarantine = validateName(
      `.cleanup-${randomUUID()}`,
      "cleanup target",
    );
    renameSync(name, quarantine);
    inspectOwned(quarantine, operation.identity, "cleanup target");
    rmSync(quarantine, { recursive: true });
    return { removed: true };
  }
  if (operation.type === "write-file") return writeAnchoredFile(operation);
  if (operation.type === "inspect-directory") {
    const name = validateName(operation.name, "directory name");
    try {
      return { identity: identity(inspectDirectory(name, name)) };
    } catch (error) {
      if (missing(error)) return { missing: true };
      throw error;
    }
  }
  if (operation.type === "list-private-directories") {
    const privatePattern =
      /^\.private-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
    const directories = [];
    for (const entry of readdirSync(".", { withFileTypes: true })) {
      if (!privatePattern.test(entry.name) || !entry.isDirectory()) continue;
      const stats = lstatSync(entry.name, { bigint: true });
      if (stats.isSymbolicLink() || !stats.isDirectory()) continue;
      directories.push({ name: entry.name, identity: identity(stats) });
    }
    return { directories };
  }
  throw new TypeError("unsupported anchored mutation");
};

try {
  const input = await readInput();
  const before = inspectDirectory(".", "verified parent");
  if (!sameIdentity(before, input.expectedIdentity)) {
    throw new TypeError("verified parent identity changed before mutation");
  }
  const result = mutate(input.operation);
  const after = inspectDirectory(".", "verified parent");
  if (!sameIdentity(after, input.expectedIdentity)) {
    throw new TypeError("verified parent identity changed during mutation");
  }
  process.stdout.write(JSON.stringify(result));
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
