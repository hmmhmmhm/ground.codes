import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

import {
  COVERAGE_COMMANDS,
  COVERAGE_REPORT_DIRECTORIES,
  REPOSITORY_ROOT,
  runCoverage,
} from "./run-coverage.mjs";

const expectedCommands = [
  ["pnpm", ["coverage:ground-codes"]],
  ["pnpm", ["coverage:api"]],
  ["pnpm", ["coverage:web"]],
  ["pnpm", ["coverage:operations"]],
  ["pnpm", ["coverage:check"]],
];

const createRepository = () => {
  const root = mkdtempSync(join(tmpdir(), "ground-codes-coverage-runner-"));
  for (const directory of COVERAGE_REPORT_DIRECTORIES) {
    mkdirSync(join(root, directory), { recursive: true });
    writeFileSync(join(root, directory, "stale.info"), "stale");
  }
  mkdirSync(join(root, "coverage", "unrelated"), { recursive: true });
  writeFileSync(join(root, "coverage", "unrelated", "keep.txt"), "keep");
  return root;
};

describe("coverage orchestrator", () => {
  test("removes only exact report directories before running producers in fixed order", () => {
    const repositoryRoot = createRepository();
    const calls = [];
    const spawn = (command, args, options) => {
      for (const directory of COVERAGE_REPORT_DIRECTORIES) {
        assert.equal(existsSync(join(repositoryRoot, directory)), false);
      }
      assert.equal(
        existsSync(join(repositoryRoot, "coverage", "unrelated", "keep.txt")),
        true,
      );
      calls.push([command, args, options]);
      return { status: 0, signal: null };
    };

    assert.equal(runCoverage({ repositoryRoot, spawn }), 0);
    assert.deepEqual(
      calls.map(([command, args]) => [command, args]),
      expectedCommands,
    );
    assert.ok(calls.every(([, , options]) => options.cwd === repositoryRoot));
    assert.ok(calls.every(([, , options]) => options.shell === false));
    assert.deepEqual(
      COVERAGE_COMMANDS.map(({ command, args }) => [command, args]),
      expectedCommands,
    );
  });

  test("stops subsequent producers and the policy checker after a failed producer", () => {
    const calls = [];
    const messages = [];
    const repositoryRoot = createRepository();
    const spawn = (command, args) => {
      calls.push([command, args]);
      return { status: calls.length === 2 ? 7 : 0, signal: null };
    };

    assert.equal(
      runCoverage({
        repositoryRoot,
        spawn,
        writeError: (message) => messages.push(message),
      }),
      7,
    );
    assert.deepEqual(calls, expectedCommands.slice(0, 2));
    assert.deepEqual(messages, ["coverage:api failed with exit status 7"]);
  });

  test("reports signaled and spawn errors deterministically", () => {
    const repositoryRoot = createRepository();
    const signalMessages = [];
    assert.equal(
      runCoverage({
        repositoryRoot,
        spawn: () => ({ status: null, signal: "SIGTERM" }),
        writeError: (message) => signalMessages.push(message),
      }),
      1,
    );
    assert.deepEqual(signalMessages, [
      "coverage:ground-codes failed with signal SIGTERM",
    ]);

    const spawnMessages = [];
    assert.equal(
      runCoverage({
        repositoryRoot,
        spawn: () => ({
          error: Object.assign(new Error("spawn pnpm ENOENT"), {
            code: "ENOENT",
          }),
          status: null,
          signal: null,
        }),
        writeError: (message) => spawnMessages.push(message),
      }),
      1,
    );
    assert.deepEqual(spawnMessages, [
      "coverage:ground-codes failed to start: ENOENT",
    ]);
  });

  test("derives the default repository root from the script location", () => {
    assert.equal(
      REPOSITORY_ROOT,
      fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, ""),
    );
  });
});
