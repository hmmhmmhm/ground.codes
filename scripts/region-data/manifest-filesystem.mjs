import { constants } from "node:fs";
import { lstat, open, readdir, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, sep } from "node:path";

export const MANAGED_GROUPS = Object.freeze(["region-dist", "region-db"]);
const LOGICAL_ROOT = "packages/geoint";
const FILE_OPEN_FLAGS =
  constants.O_RDONLY |
  (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0);
const compareText = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sameIdentity = (left, right) =>
  left.dev === right.dev && left.ino === right.ino;

const changed = (label, phase = "manifest generation") =>
  new TypeError(`${label} changed during ${phase}`);
const checkedLstat = (path, label) =>
  lstat(path, { bigint: true }).catch(() => {
    throw changed(label);
  });
const checkedRealpath = (path, label) =>
  realpath(path).catch(() => {
    throw changed(label, "canonical validation");
  });
const checkedReaddir = (path, label) =>
  readdir(path, { withFileTypes: true }).catch(() => {
    throw changed(label, "directory enumeration");
  });

const assertContained = (canonicalRoot, canonicalPath, label) => {
  const pathFromRoot = relative(canonicalRoot, canonicalPath);
  if (
    pathFromRoot === ".." ||
    pathFromRoot.startsWith(`..${sep}`) ||
    isAbsolute(pathFromRoot)
  ) {
    throw new TypeError(`${label} violates canonical managed-root containment`);
  }
};

const assertDirectoryGuards = async (guards) => {
  for (const guard of guards) {
    const current = await checkedLstat(guard.path, guard.label);
    if (
      current.isSymbolicLink() ||
      !current.isDirectory() ||
      !sameIdentity(current, guard.stats)
    ) {
      throw changed(guard.label);
    }
  }
};

const direntType = (child) =>
  ["File", "Directory", "SymbolicLink"].find((type) => child[`is${type}`]()) ??
  "Other";
const directorySnapshot = (children) =>
  children
    .map((child) => `${child.name}\0${direntType(child)}`)
    .sort(compareText)
    .join("\0");

const verifyDirectory = async ({
  path,
  label,
  guards,
  canonicalRoot,
  snapshot,
}) => {
  await assertDirectoryGuards(guards);
  assertContained(canonicalRoot, await checkedRealpath(path, label), label);
  const current = await checkedReaddir(path, label);
  await assertDirectoryGuards(guards);
  if (directorySnapshot(current) !== snapshot) {
    throw changed(label, "directory enumeration");
  }
};

const readManagedFile = async ({
  absolutePath,
  logicalPath,
  expectedStats,
  canonicalRoot,
  guards,
  beforeFileOpen,
}) => {
  await beforeFileOpen?.({ absolutePath, logicalPath });
  await assertDirectoryGuards(guards);
  assertContained(
    canonicalRoot,
    await checkedRealpath(absolutePath, logicalPath),
    logicalPath,
  );
  let handle;
  try {
    try {
      handle = await open(absolutePath, FILE_OPEN_FLAGS);
    } catch {
      throw new TypeError(`${logicalPath} changed before secure open`);
    }
    const openedStats = await handle.stat({ bigint: true });
    if (!openedStats.isFile() || !sameIdentity(openedStats, expectedStats)) {
      throw new TypeError(`${logicalPath} is not the inspected regular file`);
    }
    const contents = await handle.readFile();
    const currentStats = await checkedLstat(absolutePath, logicalPath);
    if (
      currentStats.isSymbolicLink() ||
      !currentStats.isFile() ||
      !sameIdentity(currentStats, openedStats)
    ) {
      throw new TypeError(`${logicalPath} changed after secure open`);
    }
    assertContained(
      canonicalRoot,
      await checkedRealpath(absolutePath, logicalPath),
      logicalPath,
    );
    await assertDirectoryGuards(guards);
    return contents;
  } finally {
    await handle?.close();
  }
};

const visitDirectory = async ({
  root,
  group,
  relativeDirectory,
  ancestorGuards,
  canonicalSourceRoot,
  canonicalGroupRoot,
  beforeDirectoryRead,
  beforeFileOpen,
  onFile,
}) => {
  const label = `${group} directory`;
  const directoryPath = join(root, group, ...relativeDirectory);
  const directoryStats = await checkedLstat(directoryPath, label);
  if (directoryStats.isSymbolicLink() || !directoryStats.isDirectory()) {
    throw new TypeError(
      `${group}/${relativeDirectory.join("/")} must be a directory`,
    );
  }
  const canonicalDirectory = await checkedRealpath(directoryPath, label);
  assertContained(canonicalSourceRoot, canonicalDirectory, label);
  const managedRoot = canonicalGroupRoot ?? canonicalDirectory;
  assertContained(managedRoot, canonicalDirectory, label);
  const guards = [
    ...ancestorGuards,
    { path: directoryPath, stats: directoryStats, label },
  ];
  await beforeDirectoryRead?.({
    directoryPath,
    group,
    relativeDirectory: [...relativeDirectory],
  });
  const children = await checkedReaddir(directoryPath, label);
  children.sort((left, right) => compareText(left.name, right.name));
  const verification = {
    path: directoryPath,
    label,
    guards,
    canonicalRoot: managedRoot,
    snapshot: directorySnapshot(children),
  };
  try {
    await verifyDirectory(verification);
    for (const child of children) {
      const relativeParts = [...relativeDirectory, child.name];
      const logicalPath = `${LOGICAL_ROOT}/${group}/${relativeParts.join("/")}`;
      const absolutePath = join(root, group, ...relativeParts);
      const stats = await checkedLstat(absolutePath, logicalPath);
      if (stats.isSymbolicLink()) {
        throw new TypeError(`${logicalPath} is a symlink, not a regular file`);
      }
      if (stats.isDirectory()) {
        await visitDirectory({
          root,
          group,
          relativeDirectory: relativeParts,
          ancestorGuards: guards,
          canonicalSourceRoot,
          canonicalGroupRoot: managedRoot,
          beforeDirectoryRead,
          beforeFileOpen,
          onFile,
        });
        continue;
      }
      if (!stats.isFile()) {
        throw new TypeError(`${logicalPath} is not a regular file`);
      }
      const contents = await readManagedFile({
        absolutePath,
        logicalPath,
        expectedStats: stats,
        canonicalRoot: managedRoot,
        guards,
        beforeFileOpen,
      });
      await onFile({ path: logicalPath, group, contents });
    }
  } finally {
    await verifyDirectory(verification);
  }
};

export const enumerateManagedFiles = async ({
  root,
  beforeDirectoryRead,
  beforeFileOpen,
  onFile,
}) => {
  const rootStats = await checkedLstat(root, "sourceRoot");
  if (rootStats.isSymbolicLink()) {
    throw new TypeError("sourceRoot must not be a symlink");
  }
  if (!rootStats.isDirectory()) {
    throw new TypeError("sourceRoot must be a directory");
  }
  const canonicalSourceRoot = await checkedRealpath(root, "sourceRoot");
  const rootGuard = { path: root, stats: rootStats, label: "sourceRoot" };
  await assertDirectoryGuards([rootGuard]);
  for (const group of MANAGED_GROUPS) {
    await visitDirectory({
      root,
      group,
      relativeDirectory: [],
      ancestorGuards: [rootGuard],
      canonicalSourceRoot,
      beforeDirectoryRead,
      beforeFileOpen,
      onFile,
    });
  }
};
