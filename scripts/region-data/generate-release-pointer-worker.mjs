import { randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  openSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";

import {
  durabilityPhaseFails,
  fsyncDirectory,
} from "./generate-release-durability.mjs";
import {
  identity,
  inspectDirectory,
  readRegular,
  sameIdentity,
} from "./generate-release-integrity.mjs";

const missing = (error) => error?.code === "ENOENT";
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
const optionalRegular = (name, label) => {
  try {
    return readRegular(name, label);
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
};
const inspectOwnedRegular = (name, expected, label) => {
  const stats = lstatSync(name, { bigint: true });
  if (
    stats.isSymbolicLink() ||
    !stats.isFile() ||
    !sameIdentity(stats, expected)
  ) {
    throw new TypeError(`${label} identity changed`);
  }
  return stats;
};
const removeOwned = (artifact) => {
  if (!artifact) return false;
  const stats = lstatSync(artifact.name, { bigint: true });
  if (!sameIdentity(stats, artifact.identity)) {
    throw new TypeError(`${artifact.label} identity changed before cleanup`);
  }
  unlinkSync(artifact.name);
  return true;
};
const writeSynced = (name, bytes, label) => {
  const descriptor = openSync(
    name,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0),
    0o600,
  );
  const artifact = {
    name,
    identity: identity(fstatSync(descriptor, { bigint: true })),
    label,
  };
  let descriptorOpen = true;
  try {
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptorOpen = false;
    inspectOwnedRegular(name, artifact.identity, label);
    return artifact;
  } catch (error) {
    try {
      if (descriptorOpen) closeSync(descriptor);
    } catch {}
    try {
      removeOwned(artifact);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "pointer staging and cleanup both failed",
      );
    }
    throw error;
  }
};
const preserveOriginal = (pointerName, name, original) => {
  linkSync(pointerName, name);
  const artifact = {
    name,
    identity: {
      dev: original.identity.dev,
      ino: original.identity.ino,
    },
    label: "rollback release pointer",
  };
  let descriptor;
  try {
    if (!sameIdentity(artifact.identity, original.identity)) {
      throw new TypeError("release pointer changed while preserving rollback");
    }
    inspectOwnedRegular(name, artifact.identity, artifact.label);
    descriptor = openSync(
      name,
      constants.O_RDONLY |
        (Number.isInteger(constants.O_NOFOLLOW) ? constants.O_NOFOLLOW : 0),
    );
    if (
      !sameIdentity(fstatSync(descriptor, { bigint: true }), artifact.identity)
    ) {
      throw new TypeError("rollback release pointer changed while opening");
    }
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    return artifact;
  } catch (error) {
    try {
      if (descriptor !== undefined) closeSync(descriptor);
    } catch {}
    try {
      removeOwned(artifact);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "pointer preservation and cleanup both failed",
      );
    }
    throw error;
  }
};
const assertOriginal = (state) => {
  const current = optionalRegular(state.pointerName, "release pointer");
  if (!state.original) {
    if (current) throw new TypeError("release pointer appeared before commit");
    return;
  }
  if (
    !current ||
    !sameIdentity(current.identity, state.original.identity) ||
    !current.bytes.equals(state.original.bytes)
  ) {
    throw new TypeError("release pointer changed before commit");
  }
};
const assertRestored = (state) => {
  const current = optionalRegular(state.pointerName, "restored pointer");
  if (!state.original) {
    if (current) throw new TypeError("new release pointer survived rollback");
    return;
  }
  if (!current || !current.bytes.equals(state.original.bytes)) {
    throw new TypeError("old release pointer was not restored exactly");
  }
  if (!sameIdentity(current.identity, state.original.identity)) {
    throw new TypeError("old release pointer identity was not restored");
  }
};
const inject = (state, phase) => {
  if (durabilityPhaseFails(state.failDurabilityPhase, phase)) {
    throw new TypeError(`${phase} injected failure`);
  }
};

const cleanupPrepared = (state) => {
  let changed = false;
  if (state.newArtifact) {
    changed = removeOwned(state.newArtifact) || changed;
    state.newArtifact = null;
  }
  if (state.oldArtifact) {
    changed = removeOwned(state.oldArtifact) || changed;
    state.oldArtifact = null;
  }
  if (changed) {
    fsyncDirectory(".", "pointer-abort-parent-directory-fsync", {
      failPhase: state.failDurabilityPhase,
    });
  }
};

const prepare = (input) => {
  inspectDirectory(".", input.pointerParent, "pointer parent");
  const pointerName = validateName(input.pointerName, "release pointer");
  const pointerBytes = Buffer.from(input.pointerBytes, "base64");
  const state = {
    pointerName,
    pointerBytes,
    pointerParent: input.pointerParent,
    failDurabilityPhase: input.failDurabilityPhase,
    original: optionalRegular(pointerName, "release pointer"),
    newArtifact: null,
    oldArtifact: null,
    activatedIdentity: null,
  };
  try {
    state.newArtifact = writeSynced(
      `.pointer-stage-${randomUUID()}`,
      pointerBytes,
      "staged release pointer",
    );
    if (state.original) {
      state.oldArtifact = preserveOriginal(
        pointerName,
        `.pointer-rollback-${randomUUID()}`,
        state.original,
      );
    }
    fsyncDirectory(".", "pointer-stage-parent-directory-fsync", {
      failPhase: state.failDurabilityPhase,
    });
    assertOriginal(state);
    inspectDirectory(".", state.pointerParent, "pointer parent");
    return state;
  } catch (error) {
    try {
      cleanupPrepared(state);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "pointer preparation and cleanup both failed",
      );
    }
    throw error;
  }
};

const rollback = (state) => {
  inspectDirectory(".", state.pointerParent, "pointer parent");
  inspectOwnedRegular(
    state.pointerName,
    state.activatedIdentity,
    "activated release pointer",
  );
  if (state.original) {
    inspectOwnedRegular(
      state.oldArtifact.name,
      state.oldArtifact.identity,
      state.oldArtifact.label,
    );
    renameSync(state.oldArtifact.name, state.pointerName);
    state.oldArtifact = null;
  } else {
    unlinkSync(state.pointerName);
  }
  state.activatedIdentity = null;
  fsyncDirectory(".", "pointer-rollback-parent-directory-fsync", {
    failPhase: state.failDurabilityPhase,
  });
  assertRestored(state);
};

const commit = (state) => {
  inspectDirectory(".", state.pointerParent, "pointer parent");
  assertOriginal(state);
  inspectOwnedRegular(
    state.newArtifact.name,
    state.newArtifact.identity,
    state.newArtifact.label,
  );
  renameSync(state.newArtifact.name, state.pointerName);
  state.activatedIdentity = state.newArtifact.identity;
  state.newArtifact = null;
  const events = ["pointer-renamed"];
  try {
    fsyncDirectory(".", "pointer-parent-directory-fsync", {
      failPhase: state.failDurabilityPhase,
      events,
    });
    inject(state, "pointer-readback");
    const activated = readRegular(state.pointerName, "release pointer");
    if (
      !sameIdentity(activated.identity, state.activatedIdentity) ||
      !activated.bytes.equals(state.pointerBytes)
    ) {
      throw new TypeError("release pointer readback changed after commit");
    }
    if (state.oldArtifact) {
      removeOwned(state.oldArtifact);
      state.oldArtifact = null;
    }
    return { durabilityEvents: events };
  } catch (primaryError) {
    try {
      rollback(state);
    } catch (rollbackError) {
      throw new TypeError(
        `activation indeterminate during ${rollbackError.message}: ${primaryError.message}`,
      );
    }
    throw primaryError;
  }
};

let state;
let finished = false;
const finish = (message) => {
  finished = true;
  process.send(message, () => process.disconnect());
};
process.on("message", (message) => {
  try {
    if (message?.type === "prepare") {
      state = prepare(message.input);
      process.send({ type: "ready" });
    } else if (message?.type === "commit" && state) {
      finish({ type: "committed", result: commit(state) });
    } else if (message?.type === "abort" && state) {
      cleanupPrepared(state);
      finish({ type: "aborted" });
    } else {
      throw new TypeError("unsupported pointer activation command");
    }
  } catch (error) {
    finish({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
process.once("disconnect", () => {
  if (finished || !state) return;
  try {
    cleanupPrepared(state);
  } catch {}
});
