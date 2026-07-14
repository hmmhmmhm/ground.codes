import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";

const WORKER = fileURLToPath(
  new URL("./generate-release-transaction-worker.mjs", import.meta.url),
);

export const activateReleaseTransaction = ({
  releases,
  mode,
  privateName,
  version,
  releaseIdentity,
  manifestBytes,
  metadata,
  pointerParent,
  pointerName,
  pointerBytes,
  failDurabilityPhase,
  beforeActivation,
}) =>
  new Promise((resolve, reject) => {
    const child = fork(WORKER, [], {
      cwd: releases.path,
      stdio: ["ignore", "ignore", "pipe", "ipc"],
    });
    const stderr = [];
    let settled = false;
    const settle = (callback, value) => {
      if (settled) return;
      settled = true;
      callback(value);
    };
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", (error) => settle(reject, error));
    child.on("message", async (message) => {
      if (message?.type === "before-activation") {
        try {
          await beforeActivation(message.context);
          child.send({ type: "activation-hook-complete" });
        } catch (error) {
          child.send({
            type: "activation-hook-error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      } else if (message?.type === "result") {
        settle(resolve, message.result);
        child.disconnect();
      } else if (message?.type === "error") {
        const error = new TypeError(message.message);
        error.promoted = message.promoted === true;
        settle(reject, error);
        child.disconnect();
      }
    });
    child.once("close", (code) => {
      if (settled) return;
      const detail = Buffer.concat(stderr).toString("utf8").trim();
      settle(
        reject,
        new TypeError(
          detail ||
            (code === 0
              ? "release activation transaction exited without a result"
              : "release activation transaction failed"),
        ),
      );
    });
    child.send({
      mode,
      privateName,
      version,
      releasesIdentity: { dev: releases.dev, ino: releases.ino },
      releaseIdentity: {
        dev: releaseIdentity.dev,
        ino: releaseIdentity.ino,
      },
      manifestBytes: Buffer.from(manifestBytes).toString("base64"),
      metadata,
      pointerParent,
      pointerName,
      pointerBytes: Buffer.from(pointerBytes).toString("base64"),
      failDurabilityPhase,
      hasActivationHook: typeof beforeActivation === "function",
    });
  });
