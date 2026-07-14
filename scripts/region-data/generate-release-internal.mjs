import { randomUUID } from "node:crypto";
import { dirname, join, basename } from "node:path";

import {
  ensureAnchoredChild,
  ensureAnchoredDirectory,
  optionalAnchoredChild,
  promoteAnchoredChild,
  removeOwnedAnchoredChild,
  writeAnchoredFile,
} from "./generate-release-anchored.mjs";
import { collectReleaseObjectMetadata } from "./generate-release-artifacts.mjs";
import { prepareReleasePaths } from "./generate-release-paths.mjs";
import {
  verifyObjectTree,
  verifyReleaseTree,
  writePrivateObjects,
} from "./generate-release-tree.mjs";
import {
  canonicalJson,
  createManifest,
  sha256Hex,
  validateManifest,
} from "./manifest.mjs";

const pointerBytesFor = (manifest, manifestSha256) =>
  Buffer.from(
    canonicalJson({
      schemaVersion: 1,
      version: manifest.version,
      manifestSha256,
    }),
  );

const writePointer = async (pointerPath, bytes) => {
  const parent = await ensureAnchoredDirectory(
    dirname(pointerPath),
    "release pointer parent",
  );
  await writeAnchoredFile(parent, basename(pointerPath), bytes, false);
};

const verifyReleaseTwice = async ({
  release,
  manifestBytes,
  metadata,
  between,
  context,
}) => {
  await verifyReleaseTree({ root: release, manifestBytes, metadata });
  await between?.(context);
  await verifyReleaseTree({ root: release, manifestBytes, metadata });
};

const existingReleaseResult = async ({
  release,
  manifest,
  manifestBytes,
  manifestSha256,
  metadata,
  pointerPath,
  hooks,
}) => {
  await verifyReleaseTwice({
    release,
    manifestBytes,
    metadata,
    between: hooks.afterReleaseVerification,
    context: { releaseDirectory: release.path, manifest },
  });
  await writePointer(pointerPath, pointerBytesFor(manifest, manifestSha256));
  return {
    version: manifest.version,
    manifestSha256,
    entryCount: manifest.entries.length,
    objectCount: Object.keys(metadata).length,
    createdObjects: 0,
  };
};

const buildNewRelease = async ({
  sourceRoot,
  releases,
  pointerPath,
  manifest,
  manifestBytes,
  manifestSha256,
  metadata,
  hooks,
}) => {
  const privateName = `.private-${randomUUID()}`;
  const privateRelease = await ensureAnchoredChild(
    releases,
    privateName,
    "private release",
    { exclusive: true, mode: 0o700 },
  );
  let privateOwned = true;
  try {
    const objects = await ensureAnchoredChild(
      privateRelease,
      "objects",
      "private object directory",
      { exclusive: true, mode: 0o700 },
    );
    await writePrivateObjects({
      root: objects,
      sourceRoot,
      manifest,
      metadata,
    });
    await verifyObjectTree({ root: objects, metadata });
    await hooks.afterObjectTreeReady?.({
      objectDirectory: objects.path,
      manifest,
    });
    await verifyObjectTree({ root: objects, metadata });
    await writeAnchoredFile(
      privateRelease,
      "manifest.json",
      manifestBytes,
      true,
    );
    await verifyReleaseTwice({
      release: privateRelease,
      manifestBytes,
      metadata,
      between: hooks.afterPrivateReleaseVerification,
      context: { releaseDirectory: privateRelease.path, manifest },
    });
    await promoteAnchoredChild(
      releases,
      privateName,
      manifest.version,
      privateRelease,
    );
    privateOwned = false;
    const promoted = {
      ...privateRelease,
      path: join(releases.path, manifest.version),
    };
    await verifyReleaseTwice({
      release: promoted,
      manifestBytes,
      metadata,
      between: hooks.afterReleaseVerification,
      context: { releaseDirectory: promoted.path, manifest },
    });
    await writePointer(pointerPath, pointerBytesFor(manifest, manifestSha256));
    return {
      version: manifest.version,
      manifestSha256,
      entryCount: manifest.entries.length,
      objectCount: Object.keys(metadata).length,
      createdObjects: Object.keys(metadata).length,
    };
  } catch (error) {
    if (privateOwned) {
      await removeOwnedAnchoredChild(
        releases,
        privateName,
        privateRelease,
      ).catch(() => {});
    }
    throw error;
  }
};

export const generateReleaseInternal = async (options, hooks = {}) => {
  const { sourceRoot, stagingRoot, pointerPath } =
    await prepareReleasePaths(options);
  const manifest = validateManifest(await createManifest({ sourceRoot }));
  const manifestBytes = Buffer.from(canonicalJson(manifest));
  const manifestSha256 = sha256Hex(manifestBytes);
  const metadata = await collectReleaseObjectMetadata({ sourceRoot, manifest });
  const staging = await ensureAnchoredDirectory(stagingRoot, "staging root");
  const releases = await ensureAnchoredChild(
    staging,
    "releases",
    "releases directory",
  );
  const existing = await optionalAnchoredChild(
    releases,
    manifest.version,
    "immutable release",
  );
  if (existing) {
    return existingReleaseResult({
      release: existing,
      manifest,
      manifestBytes,
      manifestSha256,
      metadata,
      pointerPath,
      hooks,
    });
  }
  return buildNewRelease({
    sourceRoot,
    releases,
    pointerPath,
    manifest,
    manifestBytes,
    manifestSha256,
    metadata,
    hooks,
  });
};
