import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, test } from "node:test";

import {
  assertApiDeployOrder,
  buildFreshCheckoutCommands,
  withFreshCheckout,
} from "./fresh-checkout.mjs";

const execute = promisify(execFile);
const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

const temporaryRoot = async (prefix) => {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  return root;
};

test("constructs the complete opt-in verification command set", () => {
  const commands = buildFreshCheckoutCommands({
    temporaryRoot: "/tmp/ground-codes-fresh",
  });

  assert.deepEqual(commands.sync, {
    command: "node",
    arguments: [
      "scripts/sync-region-data.mjs",
      "--groups",
      "region-dist,region-db",
      "--prune",
    ],
  });
  assert.deepEqual(
    commands.checks.map(({ command, arguments: arguments_ }) =>
      [command, ...arguments_].join(" "),
    ),
    [
      "pnpm install --frozen-lockfile",
      "pnpm security:audit",
      "pnpm format:check",
      "pnpm code:size-check",
      "pnpm runtime:check-pins",
      "pnpm scripts:test",
      "pnpm data:audit-labels",
      "pnpm data:report-labels",
      "pnpm language:audit",
      "pnpm lint",
      "pnpm check-types",
      "pnpm --filter @ground-codes/geoint test",
      "pnpm --filter ground-codes test",
      "pnpm --filter ground-codes test:standalone",
      "pnpm --filter api-ground-codes test",
      "pnpm --filter web test",
      "pnpm coverage",
      "pnpm build",
      "pnpm --filter web test:e2e:smoke",
    ],
  );
  assert.deepEqual(commands.workerDryRun, {
    command: "pnpm",
    arguments: [
      "exec",
      "wrangler",
      "deploy",
      "--config",
      "apps/api-ground-codes/wrangler.toml",
      "--dry-run",
      "--outdir",
      "/tmp/ground-codes-fresh/worker-dry-run",
    ],
  });
});

test("requires R2 sync before every PostGIS deploy consumer", () => {
  const valid = [
    "node scripts/sync-region-data.mjs --groups region-dist --prune",
    "pnpm --filter api-ground-codes data:apply-postgis-schema",
    "node apps/api-ground-codes/scripts/list-changed-region-datasets.mjs",
    "pnpm --filter api-ground-codes data:import-postgis",
  ].join("\n");

  assert.doesNotThrow(() => assertApiDeployOrder(valid));
  assert.throws(
    () => assertApiDeployOrder(valid.split("\n").reverse().join("\n")),
    /before PostGIS/i,
  );
});

test("fresh checkout excludes untracked data and is cleaned after failure", async () => {
  const repositoryRoot = await temporaryRoot("fresh-checkout-fixture-");
  await execute("git", ["init", "--quiet"], { cwd: repositoryRoot });
  await execute("git", ["config", "user.email", "test@example.com"], {
    cwd: repositoryRoot,
  });
  await execute("git", ["config", "user.name", "Fresh Checkout Test"], {
    cwd: repositoryRoot,
  });
  await mkdir(join(repositoryRoot, "packages/geoint"), { recursive: true });
  await writeFile(
    join(repositoryRoot, "packages/geoint/region-data-release.json"),
    "{}\n",
  );
  await execute("git", ["add", "."], { cwd: repositoryRoot });
  await execute("git", ["commit", "--quiet", "-m", "fixture"], {
    cwd: repositoryRoot,
  });
  await mkdir(join(repositoryRoot, "packages/geoint/region-dist"));
  await mkdir(join(repositoryRoot, "packages/geoint/region-db"));
  await writeFile(
    join(repositoryRoot, "packages/geoint/region-dist/untracked.json"),
    "[]",
  );

  let checkoutRoot;
  await assert.rejects(
    withFreshCheckout(
      { ref: "HEAD", repositoryRoot },
      async (freshCheckout) => {
        checkoutRoot = freshCheckout;
        await access(
          join(freshCheckout, "packages/geoint/region-data-release.json"),
        );
        await assert.rejects(
          access(join(freshCheckout, "packages/geoint/region-dist")),
          { code: "ENOENT" },
        );
        await assert.rejects(
          access(join(freshCheckout, "packages/geoint/region-db")),
          { code: "ENOENT" },
        );
        throw new Error("fixture failure");
      },
    ),
    /fixture failure/,
  );
  await assert.rejects(access(checkoutRoot), { code: "ENOENT" });
});
