import {
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  openSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import { collectReleaseObjectMetadata } from "./generate-release-artifacts.mjs";
import { canonicalJson, sha256Hex, validateManifest } from "./manifest.mjs";

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
const inspectDirectory = (path, expected, label) => {
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
});
const sameFileIdentity = (stats, expected) =>
  sameIdentity(stats, expected) &&
  String(stats.size) === expected.size &&
  String(stats.ctimeNs) === expected.ctimeNs &&
  String(stats.mtimeNs) === expected.mtimeNs;

const readRegular = (name, label) => {
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

const assertDirectoryEntries = (expectedNames, label) => {
  const actual = readdirSync(".", { withFileTypes: true })
    .map((entry) => ({ name: entry.name, regular: entry.isFile() }))
    .sort((left, right) => left.name.localeCompare(right.name));
  if (
    actual.length !== expectedNames.length ||
    actual.some(
      (entry, index) => entry.name !== expectedNames[index] || !entry.regular,
    )
  ) {
    throw new TypeError(`${label} has an extra, missing, or non-regular entry`);
  }
};

const verifyObjectDirectory = (metadata, expectedDirectory) => {
  const records = Object.values(metadata).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const names = records.map(({ name }) => validateObjectName(name));
  for (let pass = 0; pass < 2; pass += 1) {
    inspectDirectory(".", expectedDirectory, "object directory");
    assertDirectoryEntries(names, "object set");
    for (const record of records) {
      const { bytes } = readRegular(record.name, `object ${record.name}`);
      if (bytes.length !== record.size || sha256Hex(bytes) !== record.sha256) {
        throw new TypeError(
          `object ${record.name} failed integrity verification`,
        );
      }
    }
  }
};

const writeObject = ({ name, bytes }) => {
  validateObjectName(name);
  const descriptor = openSync(
    name,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0),
    0o600,
  );
  try {
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
};

const writeObjects = async (input, cwdIdentity) => {
  validateManifest(input.manifest);
  assertDirectoryEntries([], "new object directory");
  const metadata = await collectReleaseObjectMetadata({
    sourceRoot: input.sourceRoot,
    manifest: input.manifest,
    onObject: writeObject,
  });
  if (canonicalJson(metadata) !== canonicalJson(input.metadata)) {
    throw new TypeError(
      "compressed object metadata changed during construction",
    );
  }
  verifyObjectDirectory(metadata, cwdIdentity);
  return { objectCount: Object.keys(metadata).length };
};

const verifyRelease = (input, releaseIdentity) => {
  const expectedManifest = Buffer.from(input.manifestBytes, "base64");
  const rootEntries = () => {
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
  rootEntries();
  const firstManifest = readRegular("manifest.json", "release manifest");
  if (!firstManifest.bytes.equals(expectedManifest)) {
    throw new TypeError("release manifest is conflicting");
  }
  const objectIdentity = identity(
    inspectDirectory("objects", undefined, "object directory"),
  );
  process.chdir("objects");
  verifyObjectDirectory(input.metadata, objectIdentity);
  process.chdir("..");
  inspectDirectory(".", releaseIdentity, "release directory");
  inspectDirectory("objects", objectIdentity, "object directory");
  rootEntries();
  const secondManifest = readRegular("manifest.json", "release manifest");
  if (
    !secondManifest.bytes.equals(expectedManifest) ||
    secondManifest.identity.dev !== firstManifest.identity.dev ||
    secondManifest.identity.ino !== firstManifest.identity.ino
  ) {
    throw new TypeError(
      "release manifest changed during integrity verification",
    );
  }
  return { objectCount: Object.keys(input.metadata).length };
};

try {
  const input = await readInput();
  const cwdIdentity = identity(
    inspectDirectory(".", input.expectedIdentity, "anchored tree root"),
  );
  let result;
  if (input.operation === "write-objects") {
    result = await writeObjects(input, cwdIdentity);
  } else if (input.operation === "verify-objects") {
    verifyObjectDirectory(input.metadata, cwdIdentity);
    result = { objectCount: Object.keys(input.metadata).length };
  } else if (input.operation === "verify-release") {
    result = verifyRelease(input, cwdIdentity);
  } else {
    throw new TypeError("unsupported release tree operation");
  }
  process.stdout.write(JSON.stringify(result));
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
