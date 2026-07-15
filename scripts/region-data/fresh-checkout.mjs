#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { readResponseBytes, requestWithRetry } from "./sync-http.mjs";
import { verifyRegionData } from "./verify.mjs";

const executeFile = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const managedDirectories = ["region-dist", "region-db"];
const writeCredentialNames = [
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "R2_REGION_DATA_ACCESS_KEY_ID",
  "R2_REGION_DATA_SECRET_ACCESS_KEY",
];

const command = (executable, ...arguments_) => ({
  command: executable,
  arguments: arguments_,
});

export const buildFreshCheckoutCommands = ({ temporaryRoot }) => ({
  sync: command(
    "node",
    "scripts/sync-region-data.mjs",
    "--groups",
    "region-dist,region-db",
    "--prune",
  ),
  checks: [
    command("pnpm", "install", "--frozen-lockfile"),
    command("pnpm", "security:audit"),
    command("pnpm", "format:check"),
    command("pnpm", "code:size-check"),
    command("pnpm", "runtime:check-pins"),
    command("pnpm", "scripts:test"),
    command("pnpm", "data:audit-labels"),
    command("pnpm", "data:report-labels"),
    command("pnpm", "language:audit"),
    command("pnpm", "lint"),
    command("pnpm", "check-types"),
    command("pnpm", "--filter", "@ground-codes/geoint", "test"),
    command("pnpm", "--filter", "ground-codes", "test"),
    command("pnpm", "--filter", "ground-codes", "test:standalone"),
    command("pnpm", "--filter", "api-ground-codes", "test"),
    command("pnpm", "--filter", "web", "test"),
    command("pnpm", "coverage"),
    command("pnpm", "build"),
    command("pnpm", "--filter", "web", "test:e2e:smoke"),
  ],
  workerDryRun: command(
    "pnpm",
    "exec",
    "wrangler",
    "deploy",
    "--config",
    "apps/api-ground-codes/wrangler.toml",
    "--dry-run",
    "--outdir",
    join(temporaryRoot, "worker-dry-run"),
  ),
});

export const assertApiDeployOrder = (workflow) => {
  const syncIndex = workflow.indexOf("node scripts/sync-region-data.mjs");
  const consumers = [
    "data:apply-postgis-schema",
    "list-changed-region-datasets.mjs",
    "data:import-postgis",
  ];
  if (
    syncIndex < 0 ||
    consumers.some((consumer) => {
      const index = workflow.indexOf(consumer);
      return index < 0 || syncIndex >= index;
    })
  ) {
    throw new Error("R2 sync must run before PostGIS detection and import");
  }
};

const git = async (cwd, ...arguments_) =>
  executeFile("git", arguments_, { cwd, encoding: "utf8" });

export const withFreshCheckout = async (
  {
    ref = "HEAD",
    repositoryRoot: sourceRoot = repositoryRoot,
    temporaryParent = tmpdir(),
  },
  callback,
) => {
  if (typeof callback !== "function") {
    throw new TypeError("fresh checkout callback is required");
  }
  const source = resolve(sourceRoot);
  const { stdout } = await git(
    source,
    "rev-parse",
    "--verify",
    `${ref}^{commit}`,
  );
  const commit = stdout.trim();
  if (!/^[a-f0-9]{40}$/.test(commit)) {
    throw new TypeError("fresh checkout ref did not resolve to a commit");
  }

  const temporaryRoot = await mkdtemp(
    join(resolve(temporaryParent), "ground-codes-r2-only-"),
  );
  const checkoutRoot = join(temporaryRoot, "checkout");
  try {
    await git(temporaryRoot, "init", "--quiet", checkoutRoot);
    await git(
      checkoutRoot,
      "remote",
      "add",
      "origin",
      pathToFileURL(source).href,
    );
    await git(
      checkoutRoot,
      "fetch",
      "--quiet",
      "--depth=1",
      "--no-tags",
      "origin",
      commit,
    );
    await git(checkoutRoot, "checkout", "--quiet", "--detach", "FETCH_HEAD");
    const checkedOut = (
      await git(checkoutRoot, "rev-parse", "HEAD")
    ).stdout.trim();
    if (checkedOut !== commit)
      throw new Error("fresh checkout commit mismatch");
    return await callback(checkoutRoot, { commit, temporaryRoot });
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
};

const assertManagedDirectoriesAbsent = async (checkoutRoot) => {
  for (const directory of managedDirectories) {
    const path = join(checkoutRoot, "packages/geoint", directory);
    try {
      await access(path);
      throw new Error(`${directory} unexpectedly exists in the fresh checkout`);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
};

const runCommand = ({ command: executable, arguments: arguments_ }, options) =>
  new Promise((resolvePromise, reject) => {
    process.stdout.write(`$ ${[executable, ...arguments_].join(" ")}\n`);
    const child = spawn(executable, arguments_, {
      ...options,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (status, signal) => {
      if (status === 0 && signal === null) resolvePromise();
      else {
        reject(
          new Error(
            `${executable} failed with ${
              signal === null ? `status ${status}` : `signal ${signal}`
            }`,
          ),
        );
      }
    });
  });

const publicEnvironment = (baseUrl) => {
  const environment = { ...process.env, REGION_DATA_BASE_URL: baseUrl };
  for (const name of writeCredentialNames) delete environment[name];
  return environment;
};

const verifyPublicMaterialization = async ({
  baseUrl,
  checkoutRoot,
  manifestPath,
}) => {
  const pointerPath = join(
    checkoutRoot,
    "packages/geoint/region-data-release.json",
  );
  const pointer = JSON.parse(await readFile(pointerPath, "utf8"));
  if (
    !/^sha256-[a-f0-9]{64}$/.test(pointer.version) ||
    !/^[a-f0-9]{64}$/.test(pointer.manifestSha256)
  ) {
    throw new TypeError("fresh checkout release pointer is malformed");
  }
  const url = new URL(
    `releases/${pointer.version}/manifest.json`,
    `${baseUrl}/`,
  );
  const bytes = await requestWithRetry(
    url,
    (response) => readResponseBytes(response, "release manifest"),
    { attempts: 3, retryDelayMs: 100 },
  );
  const manifestHash = createHash("sha256").update(bytes).digest("hex");
  if (manifestHash !== pointer.manifestSha256) {
    throw new Error("public manifest does not match the committed pointer");
  }
  await writeFile(manifestPath, bytes);
  const result = await verifyRegionData({
    exact: true,
    manifestPath,
    materializedRoot: checkoutRoot,
  });
  if (!result.ok) {
    throw new Error(
      `fresh checkout verification failed: missing=${result.mismatches.missing.length} extra=${result.mismatches.extra.length} changed=${result.mismatches.changed.length} unreadable=${result.mismatches.unreadable.length}`,
    );
  }
  return result;
};

const sameRelease = (left, right) =>
  left.version === right.version &&
  left.entryCount === right.entryCount &&
  left.bytes === right.bytes &&
  JSON.stringify(left.groupCounts) === JSON.stringify(right.groupCounts);

export const runFreshCheckoutVerification = async ({
  baseUrl = "https://region-data.ground.codes",
  ref = "HEAD",
  repositoryRoot: sourceRoot = repositoryRoot,
} = {}) => {
  if (process.versions.node.split(".")[0] !== "22") {
    throw new Error("fresh checkout verification requires Node.js 22");
  }
  return withFreshCheckout(
    { ref, repositoryRoot: sourceRoot },
    async (checkoutRoot, { commit, temporaryRoot }) => {
      await assertManagedDirectoriesAbsent(checkoutRoot);
      assertApiDeployOrder(
        await readFile(
          join(checkoutRoot, ".github/workflows/deploy-api.yml"),
          "utf8",
        ),
      );
      const commands = buildFreshCheckoutCommands({ temporaryRoot });
      const environment = publicEnvironment(baseUrl);
      await runCommand(commands.sync, { cwd: checkoutRoot, env: environment });
      const manifestPath = join(temporaryRoot, "manifest.json");
      const first = await verifyPublicMaterialization({
        baseUrl,
        checkoutRoot,
        manifestPath,
      });
      for (const check of commands.checks) {
        await runCommand(check, { cwd: checkoutRoot, env: environment });
      }
      await runCommand(commands.workerDryRun, {
        cwd: checkoutRoot,
        env: environment,
      });
      await Promise.all(
        managedDirectories.map((directory) =>
          rm(join(checkoutRoot, "packages/geoint", directory), {
            force: true,
            recursive: true,
          }),
        ),
      );
      await assertManagedDirectoriesAbsent(checkoutRoot);
      await runCommand(commands.sync, { cwd: checkoutRoot, env: environment });
      const second = await verifyPublicMaterialization({
        baseUrl,
        checkoutRoot,
        manifestPath,
      });
      if (!sameRelease(first, second)) {
        throw new Error(
          "second materialization does not match the first release",
        );
      }
      const summary = {
        bytes: second.bytes,
        commit,
        entryCount: second.entryCount,
        groupCounts: second.groupCounts,
        version: second.version,
      };
      process.stdout.write(
        `fresh-checkout verified ${JSON.stringify(summary)}\n`,
      );
      return summary;
    },
  );
};

const mainPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (mainPath === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3 || process.argv[2] !== "--run") {
    process.stderr.write(
      "Usage: node scripts/region-data/fresh-checkout.mjs --run\n",
    );
    process.exitCode = 1;
  } else {
    try {
      await runFreshCheckoutVerification();
    } catch (error) {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    }
  }
}
