import {
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  fchmodSync,
  fsyncSync,
  lstatSync,
  openSync,
  readdirSync,
} from "node:fs";

import { fsyncDirectory } from "./generate-release-durability.mjs";
import {
  identity,
  inspectDirectory,
  sameIdentity,
} from "./generate-release-integrity.mjs";

const modeOf = (stats) => Number(stats.mode & 0o777n);
const assertEntries = (expected) => {
  const actual = readdirSync(".", { withFileTypes: true })
    .map((entry) => ({
      name: entry.name,
      directory: entry.isDirectory(),
      file: entry.isFile(),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  if (
    actual.length !== expected.length ||
    actual.some((entry, index) => {
      const wanted = expected[index];
      return (
        entry.name !== wanted.name ||
        entry.directory !== wanted.directory ||
        entry.file !== wanted.file
      );
    })
  ) {
    throw new TypeError("release tree changed before sealing");
  }
};
const sealRegular = (name, expectedIdentity, label) => {
  const before = lstatSync(name, { bigint: true });
  if (
    before.isSymbolicLink() ||
    !before.isFile() ||
    (expectedIdentity && !sameIdentity(before, expectedIdentity))
  ) {
    throw new TypeError(`${label} changed before sealing`);
  }
  chmodSync(name, 0o444);
  const descriptor = openSync(
    name,
    constants.O_RDONLY |
      (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0),
  );
  try {
    const opened = fstatSync(descriptor, { bigint: true });
    if (!sameIdentity(opened, identity(before)) || modeOf(opened) !== 0o444) {
      throw new TypeError(`${label} changed while sealing`);
    }
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
};

export const setOwnedDirectoryMode = (name, expectedIdentity, mode, label) => {
  const flags =
    constants.O_RDONLY |
    (Number.isInteger(constants.O_DIRECTORY) ? constants.O_DIRECTORY : 0) |
    (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);
  const descriptor = openSync(name, flags);
  try {
    const opened = fstatSync(descriptor, { bigint: true });
    if (!opened.isDirectory() || !sameIdentity(opened, expectedIdentity)) {
      throw new TypeError(`${label} identity changed before mode update`);
    }
    fchmodSync(descriptor, mode);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  const after = inspectDirectory(name, expectedIdentity, label);
  if (modeOf(after) !== mode) {
    throw new TypeError(`${label} mode update did not persist`);
  }
};

export const sealReleaseDirectory = ({
  releaseIdentity,
  metadata,
  failDurabilityPhase,
}) => {
  const release = inspectDirectory(
    ".",
    releaseIdentity,
    "private release directory",
  );
  assertEntries([
    { name: "manifest.json", directory: false, file: true },
    { name: "objects", directory: true, file: false },
  ]);
  const manifest = identity(lstatSync("manifest.json", { bigint: true }));
  const objects = identity(
    inspectDirectory("objects", undefined, "private object directory"),
  );
  const objectNames = Object.values(metadata)
    .map(({ name }) => name)
    .sort((left, right) => left.localeCompare(right));
  process.chdir("objects");
  try {
    inspectDirectory(".", objects, "private object directory");
    assertEntries(
      objectNames.map((name) => ({
        name,
        directory: false,
        file: true,
      })),
    );
    for (const name of objectNames)
      sealRegular(name, undefined, `object ${name}`);
    chmodSync(".", 0o555);
    fsyncDirectory(".", "sealed-object-directory-fsync", {
      failPhase: failDurabilityPhase,
    });
  } finally {
    process.chdir("..");
  }
  inspectDirectory("objects", objects, "private object directory");
  sealRegular("manifest.json", manifest, "release manifest");
  inspectDirectory(".", identity(release), "private release directory");
  assertEntries([
    { name: "manifest.json", directory: false, file: true },
    { name: "objects", directory: true, file: false },
  ]);
  chmodSync(".", 0o555);
  fsyncDirectory(".", "sealed-release-directory-fsync", {
    failPhase: failDurabilityPhase,
  });
};
