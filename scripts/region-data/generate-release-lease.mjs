import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const WORKER = fileURLToPath(
  new URL("./generate-release-lease-worker.mjs", import.meta.url),
);

const runLeaseWorker = (staging, input) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WORKER], {
      cwd: staging.path,
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
            "generation lease worker failed",
        ),
      );
    });
    child.stdin.end(
      JSON.stringify({
        expectedIdentity: { dev: staging.dev, ino: staging.ino },
        ...input,
      }),
    );
  });

const parseOwner = (bytes) => {
  let owner;
  try {
    owner = JSON.parse(Buffer.from(bytes, "base64").toString("utf8"));
  } catch {
    throw new TypeError("generation lease owner metadata is invalid");
  }
  if (
    Object.keys(owner).sort().join(",") !== "pid,token" ||
    !Number.isSafeInteger(owner.pid) ||
    owner.pid <= 0 ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      owner.token,
    )
  ) {
    throw new TypeError("generation lease owner metadata is invalid");
  }
  return owner;
};

const processIsAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "EPERM") return true;
    if (error?.code === "ESRCH") return false;
    throw error;
  }
};

export const acquireGenerationLease = async (
  staging,
  { pid = process.pid, token = randomUUID() } = {},
) => {
  const owner = { pid, token };
  try {
    const acquired = await runLeaseWorker(staging, {
      operation: "acquire",
      owner,
    });
    return { ...acquired.identity, owner };
  } catch (error) {
    if (!/generation lease already exists/i.test(error.message)) throw error;
  }
  const inspected = await runLeaseWorker(staging, { operation: "inspect" });
  const existingOwner = parseOwner(inspected.bytes);
  if (processIsAlive(existingOwner.pid)) {
    throw new TypeError(
      `generation lease is held by live process ${existingOwner.pid}`,
    );
  }
  await runLeaseWorker(staging, {
    operation: "remove",
    leaseIdentity: inspected.identity,
    owner: existingOwner,
  });
  const acquired = await runLeaseWorker(staging, {
    operation: "acquire",
    owner,
  });
  return { ...acquired.identity, owner };
};

export const releaseGenerationLease = (staging, lease) =>
  runLeaseWorker(staging, {
    operation: "remove",
    leaseIdentity: { dev: lease.dev, ino: lease.ino },
    owner: lease.owner,
  });
