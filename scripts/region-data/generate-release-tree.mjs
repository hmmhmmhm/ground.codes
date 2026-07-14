import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const WORKER = fileURLToPath(
  new URL("./generate-release-tree-worker.mjs", import.meta.url),
);

const runTreeWorker = ({ root, operation, input }) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WORKER], {
      cwd: root.path,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(Buffer.concat(stdout).toString("utf8")));
        } catch (error) {
          reject(error);
        }
        return;
      }
      reject(
        new TypeError(
          Buffer.concat(stderr).toString("utf8").trim() ||
            "release tree worker failed",
        ),
      );
    });
    child.stdin.end(
      JSON.stringify({
        operation,
        expectedIdentity: { dev: root.dev, ino: root.ino },
        ...input,
      }),
    );
  });

export const writePrivateObjects = ({
  root,
  sourceRoot,
  manifest,
  failDurabilityPhase,
}) =>
  runTreeWorker({
    root,
    operation: "write-objects",
    input: { sourceRoot, manifest, failDurabilityPhase },
  });

export const verifyObjectTree = ({ root, metadata }) =>
  runTreeWorker({
    root,
    operation: "verify-objects",
    input: { metadata },
  });

export const verifyReleaseTree = ({ root, manifestBytes, metadata }) =>
  runTreeWorker({
    root,
    operation: "verify-release",
    input: {
      manifestBytes: Buffer.from(manifestBytes).toString("base64"),
      metadata,
    },
  });
