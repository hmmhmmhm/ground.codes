import { randomUUID } from "node:crypto";
import { basename, dirname } from "node:path";

import {
  ensureAnchoredChild,
  ensureAnchoredDirectory,
  listPrivateAnchoredChildren,
  optionalAnchoredChild,
  removeOwnedAnchoredChild,
  writeAnchoredFile,
} from "./generate-release-anchored.mjs";
import { collectReleaseObjectMetadata } from "./generate-release-artifacts.mjs";
import {
  acquireGenerationLease,
  releaseGenerationLease,
} from "./generate-release-lease.mjs";
import { prepareReleasePaths } from "./generate-release-paths.mjs";
import {
  verifyObjectTree,
  writePrivateObjects,
} from "./generate-release-tree.mjs";
import { activateReleaseTransaction } from "./generate-release-transaction.mjs";
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

const cleanupPrivateOrphans = async (releases) => {
  const { directories } = await listPrivateAnchoredChildren(releases);
  for (const directory of directories) {
    await removeOwnedAnchoredChild(releases, directory.name, {
      ...directory.identity,
      path: `${releases.path}/${directory.name}`,
    });
  }
};

const activationHook = (hooks) => {
  const callbacks = [
    hooks.afterPrivateReleaseVerification,
    hooks.afterReleaseVerification,
    hooks.beforeActivation,
  ].filter((callback) => typeof callback === "function");
  if (callbacks.length === 0) return undefined;
  return async (context) => {
    for (const callback of callbacks) await callback(context);
  };
};

const emitDurabilityEvents = async (hooks, events) => {
  for (const event of events) await hooks.onDurabilityEvent?.(event);
};

const resultFor = ({ manifest, manifestSha256, metadata, createdObjects }) => ({
  version: manifest.version,
  manifestSha256,
  entryCount: manifest.entries.length,
  objectCount: Object.keys(metadata).length,
  createdObjects,
});

const activateExistingRelease = async ({
  existing,
  releases,
  pointerParent,
  pointerPath,
  pointerBytes,
  manifest,
  manifestBytes,
  manifestSha256,
  metadata,
  hooks,
}) => {
  const transaction = await activateReleaseTransaction({
    releases,
    mode: "existing",
    version: manifest.version,
    releaseIdentity: existing,
    manifestBytes,
    metadata,
    pointerParent,
    pointerName: basename(pointerPath),
    pointerBytes,
    failDurabilityPhase: hooks.failDurabilityPhase,
    beforeActivation: activationHook(hooks),
  });
  await emitDurabilityEvents(hooks, transaction.durabilityEvents);
  await hooks.onPerformance?.({
    mode: "existing",
    gzipSourcePasses: 2,
    compressedObjectReadPasses: transaction.compressedObjectReadPasses,
  });
  return resultFor({
    manifest,
    manifestSha256,
    metadata,
    createdObjects: 0,
  });
};

const buildNewRelease = async ({
  sourceRoot,
  releases,
  pointerParent,
  pointerPath,
  pointerBytes,
  manifest,
  manifestBytes,
  manifestSha256,
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
  let primaryError;
  try {
    const objects = await ensureAnchoredChild(
      privateRelease,
      "objects",
      "private object directory",
      { exclusive: true, mode: 0o700 },
    );
    const writer = await writePrivateObjects({
      root: objects,
      sourceRoot,
      manifest,
      failDurabilityPhase: hooks.failDurabilityPhase,
    });
    const events = [...writer.durabilityEvents];
    let objectReadPasses = 0;
    objectReadPasses += (
      await verifyObjectTree({ root: objects, metadata: writer.metadata })
    ).compressedObjectReadPasses;
    if (typeof hooks.afterObjectTreeReady === "function") {
      await hooks.afterObjectTreeReady({
        objectDirectory: objects.path,
        manifest,
      });
      objectReadPasses += (
        await verifyObjectTree({ root: objects, metadata: writer.metadata })
      ).compressedObjectReadPasses;
    }
    const manifestWrite = await writeAnchoredFile(
      privateRelease,
      "manifest.json",
      manifestBytes,
      {
        immutable: true,
        writtenEvent: "manifest-written",
        directoryFsyncPhase: "private-release-directory-fsync",
        failDurabilityPhase: hooks.failDurabilityPhase,
      },
    );
    events.push(...manifestWrite.durabilityEvents);
    let transaction;
    try {
      transaction = await activateReleaseTransaction({
        releases,
        mode: "new",
        privateName,
        version: manifest.version,
        releaseIdentity: privateRelease,
        manifestBytes,
        metadata: writer.metadata,
        pointerParent,
        pointerName: basename(pointerPath),
        pointerBytes,
        failDurabilityPhase: hooks.failDurabilityPhase,
        beforeActivation: activationHook(hooks),
      });
      privateOwned = false;
    } catch (error) {
      if (error.promoted) privateOwned = false;
      throw error;
    }
    events.push(...transaction.durabilityEvents);
    await emitDurabilityEvents(hooks, events);
    await hooks.onPerformance?.({
      mode: "new",
      gzipSourcePasses: 1 + writer.gzipSourcePasses,
      compressedObjectReadPasses:
        objectReadPasses + transaction.compressedObjectReadPasses,
    });
    return resultFor({
      manifest,
      manifestSha256,
      metadata: writer.metadata,
      createdObjects: writer.objectCount,
    });
  } catch (error) {
    primaryError = error;
  }
  if (privateOwned) {
    try {
      await removeOwnedAnchoredChild(releases, privateName, privateRelease);
    } catch (cleanupError) {
      throw new AggregateError(
        [primaryError, cleanupError],
        "release generation and owned private cleanup both failed",
      );
    }
  }
  throw primaryError;
};

const generateUnderLease = async ({ paths, staging, hooks }) => {
  await hooks.afterLeaseAcquired?.({
    pid: hooks.leasePid ?? process.pid,
  });
  const releases = await ensureAnchoredChild(
    staging,
    "releases",
    "releases directory",
  );
  await cleanupPrivateOrphans(releases);
  const manifest = validateManifest(
    await createManifest({ sourceRoot: paths.sourceRoot }),
  );
  const manifestBytes = Buffer.from(canonicalJson(manifest));
  const manifestSha256 = sha256Hex(manifestBytes);
  const pointerBytes = pointerBytesFor(manifest, manifestSha256);
  const pointerParent = await ensureAnchoredDirectory(
    dirname(paths.pointerPath),
    "release pointer parent",
  );
  const existing = await optionalAnchoredChild(
    releases,
    manifest.version,
    "immutable release",
  );
  if (existing) {
    const metadata = await collectReleaseObjectMetadata({
      sourceRoot: paths.sourceRoot,
      manifest,
    });
    return activateExistingRelease({
      existing,
      releases,
      pointerParent,
      pointerPath: paths.pointerPath,
      pointerBytes,
      manifest,
      manifestBytes,
      manifestSha256,
      metadata,
      hooks,
    });
  }
  return buildNewRelease({
    sourceRoot: paths.sourceRoot,
    releases,
    pointerParent,
    pointerPath: paths.pointerPath,
    pointerBytes,
    manifest,
    manifestBytes,
    manifestSha256,
    hooks,
  });
};

export const generateReleaseInternal = async (options, hooks = {}) => {
  const paths = await prepareReleasePaths(options);
  const staging = await ensureAnchoredDirectory(
    paths.stagingRoot,
    "staging root",
  );
  const lease = await acquireGenerationLease(staging, {
    pid: hooks.leasePid ?? process.pid,
  });
  let result;
  let primaryError;
  try {
    result = await generateUnderLease({ paths, staging, hooks });
  } catch (error) {
    primaryError = error;
  }
  try {
    await hooks.beforeLeaseRelease?.({
      leasePath: `${staging.path}/.generate-lease`,
      owner: lease.owner,
    });
    await releaseGenerationLease(staging, lease);
  } catch (cleanupError) {
    if (primaryError) {
      throw new AggregateError(
        [primaryError, cleanupError],
        "release generation and lease cleanup both failed",
      );
    }
    throw cleanupError;
  }
  if (primaryError) throw primaryError;
  return result;
};
