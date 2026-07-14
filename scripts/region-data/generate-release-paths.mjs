import { lstat, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

const missing = (error) => error?.code === "ENOENT";

const toPath = (value, label) => {
  if (
    (typeof value !== "string" && !(value instanceof URL)) ||
    value.length === 0
  ) {
    throw new TypeError(`${label} must be a non-empty path string or file URL`);
  }
  return resolve(value instanceof URL ? fileURLToPath(value) : value);
};

const canonicalCandidate = async (path) => {
  const missingSegments = [];
  let current = path;
  for (;;) {
    try {
      const canonicalParent = await realpath(current);
      return resolve(canonicalParent, ...missingSegments.reverse());
    } catch (error) {
      if (!missing(error)) throw error;
      const parent = dirname(current);
      if (parent === current) throw error;
      missingSegments.push(basename(current));
      current = parent;
    }
  }
};

const contains = (root, target) => {
  const fromRoot = relative(root, target);
  return (
    fromRoot === "" ||
    (!isAbsolute(fromRoot) &&
      fromRoot !== ".." &&
      !fromRoot.startsWith(`..${sep}`))
  );
};

const rejectExistingPointerType = async (pointerPath) => {
  try {
    const stats = await lstat(pointerPath);
    if (stats.isSymbolicLink() || !stats.isFile()) {
      throw new TypeError(
        "release pointer must be a regular file when present",
      );
    }
  } catch (error) {
    if (!missing(error)) throw error;
  }
};

export const prepareReleasePaths = async ({
  sourceRoot: sourceValue,
  stagingRoot: stagingValue,
  pointerPath: pointerValue,
}) => {
  const paths = {
    sourceRoot: toPath(sourceValue, "sourceRoot"),
    stagingRoot: toPath(stagingValue, "stagingRoot"),
    pointerPath: toPath(pointerValue, "pointerPath"),
  };
  const groups = ["region-dist", "region-db"].map((group) =>
    join(paths.sourceRoot, group),
  );
  const [canonicalStaging, canonicalPointer, ...canonicalGroups] =
    await Promise.all(
      [paths.stagingRoot, paths.pointerPath, ...groups].map(canonicalCandidate),
    );
  if (
    contains(paths.stagingRoot, paths.pointerPath) ||
    contains(canonicalStaging, canonicalPointer)
  ) {
    throw new TypeError(
      "release pointer must not overlap the staging root or a release artifact",
    );
  }
  for (const [index, group] of groups.entries()) {
    if (
      contains(group, paths.pointerPath) ||
      contains(canonicalGroups[index], canonicalPointer)
    ) {
      throw new TypeError(
        "release pointer must not overlap a managed source group",
      );
    }
    if (
      contains(group, paths.stagingRoot) ||
      contains(canonicalGroups[index], canonicalStaging)
    ) {
      throw new TypeError(
        "staging root must not overlap a managed source group",
      );
    }
  }
  await rejectExistingPointerType(paths.pointerPath);
  return paths;
};
