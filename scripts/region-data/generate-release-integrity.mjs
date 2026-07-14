import {
  closeSync,
  constants,
  lstatSync,
  openSync,
  readdirSync,
  readFileSync,
} from "node:fs";

import { sha256Hex } from "./manifest.mjs";

export const identity = (stats) => ({
  dev: String(stats.dev),
  ino: String(stats.ino),
});
export const sameIdentity = (stats, expected) =>
  String(stats.dev) === expected.dev && String(stats.ino) === expected.ino;

export const inspectDirectory = (path, expected, label) => {
  const stats = lstatSync(path, { bigint: true });
  if (
    stats.isSymbolicLink() ||
    !stats.isDirectory() ||
    (expected && !sameIdentity(stats, expected))
  ) {
    throw new TypeError(`${label} identity changed`);
  }
  return stats;
};

const validateObjectName = (name) => {
  if (!/^[a-f0-9]{64}\.json\.gz$/.test(name)) {
    throw new TypeError(
      "object name is outside the content-addressed contract",
    );
  }
  return name;
};
const fileIdentity = (stats) => ({
  ...identity(stats),
  size: String(stats.size),
  ctimeNs: String(stats.ctimeNs),
  mtimeNs: String(stats.mtimeNs),
  mode: String(stats.mode & 0o777n),
});
const sameFileIdentity = (stats, expected) =>
  sameIdentity(stats, expected) &&
  String(stats.size) === expected.size &&
  String(stats.ctimeNs) === expected.ctimeNs &&
  String(stats.mtimeNs) === expected.mtimeNs &&
  String(stats.mode & 0o777n) === expected.mode;

const assertSealedMode = (statsOrIdentity, expected, label) => {
  const actual =
    typeof statsOrIdentity.mode === "bigint"
      ? String(statsOrIdentity.mode & 0o777n)
      : statsOrIdentity.mode;
  if (actual !== String(expected)) {
    throw new TypeError(
      `${label} is not sealed to mode 0${expected.toString(8)}`,
    );
  }
};

export const readRegular = (name, label) => {
  const before = lstatSync(name, { bigint: true });
  if (before.isSymbolicLink() || !before.isFile()) {
    throw new TypeError(`${label} must be a regular file`);
  }
  const flags =
    constants.O_RDONLY |
    (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);
  const descriptor = openSync(name, flags);
  try {
    const bytes = readFileSync(descriptor);
    const after = lstatSync(name, { bigint: true });
    const expected = fileIdentity(before);
    if (!sameFileIdentity(after, expected)) {
      throw new TypeError(`${label} changed during integrity verification`);
    }
    return { bytes, identity: expected };
  } finally {
    closeSync(descriptor);
  }
};

const assertObjectEntries = (records) => {
  const expectedNames = records.map(({ name }) => validateObjectName(name));
  const actual = readdirSync(".", { withFileTypes: true })
    .map((entry) => ({ name: entry.name, regular: entry.isFile() }))
    .sort((left, right) => left.name.localeCompare(right.name));
  if (
    actual.length !== expectedNames.length ||
    actual.some(
      (entry, index) => entry.name !== expectedNames[index] || !entry.regular,
    )
  ) {
    throw new TypeError(
      "object set has an extra, missing, or non-regular entry",
    );
  }
};

export const verifyObjectDirectory = (
  metadata,
  expectedDirectory,
  { sealed = false } = {},
) => {
  const records = Object.values(metadata).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  inspectDirectory(".", expectedDirectory, "object directory");
  assertObjectEntries(records);
  for (const record of records) {
    const { bytes, identity: objectIdentity } = readRegular(
      record.name,
      `object ${record.name}`,
    );
    if (sealed) {
      assertSealedMode(objectIdentity, 0o444, `object ${record.name}`);
    }
    if (bytes.length !== record.size || sha256Hex(bytes) !== record.sha256) {
      throw new TypeError(
        `object ${record.name} failed integrity verification`,
      );
    }
  }
  return { compressedObjectReadPasses: 1 };
};

const assertReleaseEntries = () => {
  const entries = readdirSync(".", { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  if (
    entries.length !== 2 ||
    entries[0].name !== "manifest.json" ||
    !entries[0].isFile() ||
    entries[1].name !== "objects" ||
    !entries[1].isDirectory()
  ) {
    throw new TypeError(
      "immutable release has an extra, missing, or invalid entry",
    );
  }
};

export const verifyReleaseDirectory = ({
  releaseIdentity,
  manifestBytes,
  metadata,
}) => {
  assertSealedMode(
    inspectDirectory(".", releaseIdentity, "release directory"),
    0o555,
    "release directory",
  );
  assertReleaseEntries();
  const firstManifest = readRegular("manifest.json", "release manifest");
  assertSealedMode(firstManifest.identity, 0o444, "release manifest");
  if (!firstManifest.bytes.equals(manifestBytes)) {
    throw new TypeError("release manifest is conflicting");
  }
  const objectStats = inspectDirectory(
    "objects",
    undefined,
    "object directory",
  );
  assertSealedMode(objectStats, 0o555, "object directory");
  const objectIdentity = identity(objectStats);
  let result;
  process.chdir("objects");
  try {
    result = verifyObjectDirectory(metadata, objectIdentity, { sealed: true });
  } finally {
    process.chdir("..");
  }
  assertSealedMode(
    inspectDirectory(".", releaseIdentity, "release directory"),
    0o555,
    "release directory",
  );
  assertSealedMode(
    inspectDirectory("objects", objectIdentity, "object directory"),
    0o555,
    "object directory",
  );
  assertReleaseEntries();
  const secondManifest = readRegular("manifest.json", "release manifest");
  assertSealedMode(secondManifest.identity, 0o444, "release manifest");
  if (
    !secondManifest.bytes.equals(manifestBytes) ||
    secondManifest.identity.dev !== firstManifest.identity.dev ||
    secondManifest.identity.ino !== firstManifest.identity.ino
  ) {
    throw new TypeError(
      "release manifest changed during integrity verification",
    );
  }
  return result;
};
