import { lstatSync, renameSync } from "node:fs";
import { join } from "node:path";

import { runAnchoredMutation } from "./generate-release-anchored.mjs";
import { fsyncDirectory } from "./generate-release-durability.mjs";
import {
  inspectDirectory,
  sameIdentity,
  verifyReleaseDirectory,
} from "./generate-release-integrity.mjs";

const inspectReleaseEntry = (name, expected) => {
  const stats = lstatSync(name, { bigint: true });
  if (
    stats.isSymbolicLink() ||
    !stats.isDirectory() ||
    !sameIdentity(stats, expected)
  ) {
    throw new TypeError(
      "final release entry identity changed before activation",
    );
  }
};
const missing = (name) => {
  try {
    lstatSync(name);
    return false;
  } catch (error) {
    if (error?.code === "ENOENT") return true;
    throw error;
  }
};

const verifyReleaseEntry = (input, name) => {
  inspectReleaseEntry(name, input.releaseIdentity);
  process.chdir(name);
  try {
    return verifyReleaseDirectory({
      releaseIdentity: input.releaseIdentity,
      manifestBytes: Buffer.from(input.manifestBytes, "base64"),
      metadata: input.metadata,
    });
  } finally {
    process.chdir("..");
    inspectDirectory(".", input.releasesIdentity, "releases directory");
  }
};

const runActivationHook = (releaseDirectory) =>
  new Promise((resolve, reject) => {
    const onMessage = (message) => {
      if (message?.type === "activation-hook-complete") {
        process.off("message", onMessage);
        resolve();
      } else if (message?.type === "activation-hook-error") {
        process.off("message", onMessage);
        reject(new TypeError(message.message || "activation hook failed"));
      }
    };
    process.on("message", onMessage);
    process.send({
      type: "before-activation",
      context: { releaseDirectory },
    });
  });

const activate = async (input, state) => {
  const events = [];
  let objectReadPasses = 0;
  let releaseName = input.mode === "new" ? input.privateName : input.version;
  objectReadPasses += verifyReleaseEntry(
    input,
    releaseName,
  ).compressedObjectReadPasses;
  events.push("release-verified");
  if (input.hasActivationHook) {
    await runActivationHook(join(process.cwd(), releaseName));
    objectReadPasses += verifyReleaseEntry(
      input,
      releaseName,
    ).compressedObjectReadPasses;
  }
  if (input.mode === "new") {
    if (!missing(input.version)) {
      throw new TypeError("immutable release destination already exists");
    }
    inspectReleaseEntry(input.privateName, input.releaseIdentity);
    renameSync(input.privateName, input.version);
    inspectReleaseEntry(input.version, input.releaseIdentity);
    releaseName = input.version;
    state.promoted = true;
    events.push("release-promoted");
    fsyncDirectory(".", "releases-directory-fsync", {
      failPhase: input.failDurabilityPhase,
      events,
    });
  }
  inspectReleaseEntry(releaseName, input.releaseIdentity);
  const pointerResult = await runAnchoredMutation({
    cwd: input.pointerParent.path,
    expectedIdentity: input.pointerParent,
    operation: {
      type: "write-file",
      name: input.pointerName,
      bytes: input.pointerBytes,
      immutable: false,
      writtenEvent: "pointer-renamed",
      directoryFsyncPhase: "pointer-parent-directory-fsync",
      failDurabilityPhase: input.failDurabilityPhase,
    },
  });
  events.push(...pointerResult.durabilityEvents);
  return {
    compressedObjectReadPasses: objectReadPasses,
    durabilityEvents: events,
  };
};

process.once("message", async (input) => {
  const state = { promoted: false };
  try {
    inspectDirectory(".", input.releasesIdentity, "releases directory");
    const result = await activate(input, state);
    process.send({ type: "result", result });
  } catch (error) {
    process.send({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
      promoted: state.promoted,
    });
  }
});
