import { fork } from "node:child_process";
import { lstatSync, renameSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { fsyncDirectory } from "./generate-release-durability.mjs";
import {
  inspectDirectory,
  sameIdentity,
  verifyReleaseDirectory,
} from "./generate-release-integrity.mjs";
import {
  sealReleaseDirectory,
  setOwnedDirectoryMode,
} from "./generate-release-seal.mjs";

const POINTER_WORKER = fileURLToPath(
  new URL("./generate-release-pointer-worker.mjs", import.meta.url),
);

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

const sealReleaseEntry = (input) => {
  inspectReleaseEntry(input.privateName, input.releaseIdentity);
  process.chdir(input.privateName);
  try {
    sealReleaseDirectory({
      releaseIdentity: input.releaseIdentity,
      metadata: input.metadata,
      failDurabilityPhase: input.failDurabilityPhase,
    });
  } finally {
    process.chdir("..");
    inspectDirectory(".", input.releasesIdentity, "releases directory");
  }
  inspectReleaseEntry(input.privateName, input.releaseIdentity);
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

const preparePointerActivation = async (input) => {
  const child = fork(POINTER_WORKER, [], {
    cwd: input.pointerParent.path,
    execArgv: [],
    stdio: ["ignore", "ignore", "pipe", "ipc"],
  });
  const stderr = [];
  let pending;
  let terminalError;
  let finished = false;
  const fail = (error) => {
    terminalError = error;
    if (!pending) return;
    const current = pending;
    pending = undefined;
    current.reject(error);
  };
  child.stderr.on("data", (chunk) => stderr.push(chunk));
  child.once("error", fail);
  child.on("message", (message) => {
    if (!pending) return;
    const current = pending;
    pending = undefined;
    if (message?.type === "error") {
      const error = new TypeError(message.message);
      terminalError = error;
      finished = true;
      current.reject(error);
    } else if (message?.type === current.expected) {
      current.resolve(message.result);
    } else {
      current.reject(new TypeError("unexpected pointer worker response"));
    }
  });
  child.once("close", (code) => {
    if (finished) return;
    const detail = Buffer.concat(stderr).toString("utf8").trim();
    fail(
      new TypeError(
        detail ||
          `pointer activation worker exited before completion (${code})`,
      ),
    );
  });
  const command = (message, expected) => {
    if (terminalError) return Promise.reject(terminalError);
    if (pending) {
      return Promise.reject(
        new TypeError("pointer activation command already pending"),
      );
    }
    return new Promise((resolve, reject) => {
      pending = { expected, resolve, reject };
      child.send(message, (error) => {
        if (error) fail(error);
      });
    });
  };
  await command(
    {
      type: "prepare",
      input: {
        pointerParent: {
          dev: input.pointerParent.dev,
          ino: input.pointerParent.ino,
        },
        pointerName: input.pointerName,
        pointerBytes: input.pointerBytes,
        failDurabilityPhase: input.failDurabilityPhase,
      },
    },
    "ready",
  );
  return {
    get finished() {
      return finished;
    },
    async commit() {
      try {
        return await command({ type: "commit" }, "committed");
      } finally {
        finished = true;
      }
    },
    async abort() {
      try {
        await command({ type: "abort" }, "aborted");
      } finally {
        finished = true;
      }
    },
  };
};

const rollbackPromotion = (input, state) => {
  inspectReleaseEntry(input.version, input.releaseIdentity);
  if (!missing(input.privateName)) {
    throw new TypeError("private release path reappeared before rollback");
  }
  setOwnedDirectoryMode(
    input.version,
    input.releaseIdentity,
    0o700,
    "promoted release directory",
  );
  renameSync(input.version, input.privateName);
  state.promoted = false;
  inspectReleaseEntry(input.privateName, input.releaseIdentity);
  fsyncDirectory(".", "release-promotion-rollback-directory-fsync", {
    failPhase: input.failDurabilityPhase,
  });
};

const activate = async (input, state) => {
  const events = [];
  let objectReadPasses = 0;
  let releaseName = input.mode === "new" ? input.privateName : input.version;
  if (input.mode === "new") sealReleaseEntry(input);
  const pointer = await preparePointerActivation(input);
  let finalVerified = false;
  try {
    if (input.hasActivationHook) {
      await runActivationHook(join(process.cwd(), releaseName));
      if (input.mode === "new") {
        objectReadPasses += verifyReleaseEntry(
          input,
          releaseName,
        ).compressedObjectReadPasses;
      }
    }
    if (input.mode === "new") {
      if (!missing(input.version)) {
        throw new TypeError("immutable release destination already exists");
      }
      inspectReleaseEntry(input.privateName, input.releaseIdentity);
      setOwnedDirectoryMode(
        input.privateName,
        input.releaseIdentity,
        0o700,
        "private release directory",
      );
      renameSync(input.privateName, input.version);
      releaseName = input.version;
      state.promoted = true;
      setOwnedDirectoryMode(
        input.version,
        input.releaseIdentity,
        0o555,
        "promoted release directory",
      );
      inspectReleaseEntry(input.version, input.releaseIdentity);
      events.push("release-promoted");
      fsyncDirectory(".", "releases-directory-fsync", {
        failPhase: input.failDurabilityPhase,
        events,
      });
    }
    inspectReleaseEntry(releaseName, input.releaseIdentity);
    objectReadPasses += verifyReleaseEntry(
      input,
      releaseName,
    ).compressedObjectReadPasses;
    events.push("release-verified");
    finalVerified = true;
    inspectReleaseEntry(releaseName, input.releaseIdentity);
    const pointerResult = await pointer.commit();
    events.push(...pointerResult.durabilityEvents);
    return {
      compressedObjectReadPasses: objectReadPasses,
      durabilityEvents: events,
    };
  } catch (primaryError) {
    let error = primaryError;
    if (state.promoted && !finalVerified) {
      try {
        rollbackPromotion(input, state);
      } catch (rollbackError) {
        error = new AggregateError(
          [error, rollbackError],
          "release verification and promotion rollback both failed",
        );
      }
    }
    if (!pointer.finished) {
      try {
        await pointer.abort();
      } catch (cleanupError) {
        error = new AggregateError(
          [error, cleanupError],
          "release activation and pointer cleanup both failed",
        );
      }
    }
    throw error;
  }
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
