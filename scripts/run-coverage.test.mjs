import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
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

const lockFile = (repositoryRoot) =>
  join(repositoryRoot, "coverage", ".run-coverage.lock");

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
  test("rejects an intermediate coverage symlink without deleting outside files", () => {
    const repositoryRoot = mkdtempSync(
      join(tmpdir(), "ground-codes-symlink-root-"),
    );
    const outside = mkdtempSync(join(tmpdir(), "ground-codes-outside-"));
    for (const directory of COVERAGE_REPORT_DIRECTORIES) {
      const outsideTarget = join(outside, directory.replace(/^coverage\//, ""));
      mkdirSync(outsideTarget, { recursive: true });
      writeFileSync(join(outsideTarget, "keep.txt"), "keep");
    }
    symlinkSync(outside, join(repositoryRoot, "coverage"), "dir");
    const messages = [];
    let spawned = false;

    assert.equal(
      runCoverage({
        repositoryRoot,
        spawn: () => {
          spawned = true;
          return { status: 0, signal: null };
        },
        writeError: (message) => messages.push(message),
      }),
      1,
    );

    assert.equal(spawned, false);
    for (const directory of COVERAGE_REPORT_DIRECTORIES) {
      assert.equal(
        existsSync(
          join(outside, directory.replace(/^coverage\//, ""), "keep.txt"),
        ),
        true,
      );
    }
    assert.equal(existsSync(join(outside, ".run-coverage.lock")), false);
    assert.deepEqual(messages, ["coverage setup failed: unsafe coverage root"]);
  });

  test("rejects a final report symlink before cleanup or producer execution", () => {
    const repositoryRoot = createRepository();
    const outside = mkdtempSync(join(tmpdir(), "ground-codes-target-outside-"));
    const linkedDirectory = COVERAGE_REPORT_DIRECTORIES[1];
    rmSync(join(repositoryRoot, linkedDirectory), {
      recursive: true,
      force: true,
    });
    writeFileSync(join(outside, "keep.txt"), "keep");
    symlinkSync(outside, join(repositoryRoot, linkedDirectory), "dir");
    const messages = [];
    let spawned = false;

    assert.equal(
      runCoverage({
        repositoryRoot,
        spawn: () => {
          spawned = true;
          return { status: 0, signal: null };
        },
        writeError: (message) => messages.push(message),
      }),
      1,
    );

    assert.equal(spawned, false);
    assert.equal(existsSync(join(outside, "keep.txt")), true);
    assert.equal(
      existsSync(
        join(repositoryRoot, COVERAGE_REPORT_DIRECTORIES[0], "stale.info"),
      ),
      true,
    );
    assert.equal(existsSync(lockFile(repositoryRoot)), false);
    assert.deepEqual(messages, [
      `coverage cleanup failed: unsafe coverage report directory ${linkedDirectory}`,
    ]);
  });

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
    assert.equal(existsSync(lockFile(repositoryRoot)), false);

    assert.equal(
      runCoverage({
        repositoryRoot,
        spawn: () => ({ status: 0, signal: null }),
      }),
      0,
    );
  });

  test("serializes nested runs and releases the lock after success", () => {
    const repositoryRoot = createRepository();
    const outerCalls = [];
    const innerCalls = [];
    const innerMessages = [];
    const marker = join(repositoryRoot, "coverage", "api", "nested.txt");

    const outerResult = runCoverage({
      repositoryRoot,
      spawn: (command, args) => {
        outerCalls.push([command, args]);
        if (outerCalls.length === 1) {
          mkdirSync(join(repositoryRoot, "coverage", "api"), {
            recursive: true,
          });
          writeFileSync(marker, "keep during contention");
          assert.equal(
            runCoverage({
              repositoryRoot,
              spawn: (innerCommand, innerArgs) => {
                innerCalls.push([innerCommand, innerArgs]);
                return { status: 0, signal: null };
              },
              writeError: (message) => innerMessages.push(message),
            }),
            1,
          );
          assert.equal(existsSync(marker), true);
        }
        return { status: 0, signal: null };
      },
    });

    assert.equal(outerResult, 0);
    assert.deepEqual(outerCalls, expectedCommands);
    assert.deepEqual(innerCalls, []);
    assert.deepEqual(innerMessages, ["coverage run already in progress"]);
    assert.equal(existsSync(lockFile(repositoryRoot)), false);

    const subsequentCalls = [];
    assert.equal(
      runCoverage({
        repositoryRoot,
        spawn: (command, args) => {
          subsequentCalls.push([command, args]);
          return { status: 0, signal: null };
        },
      }),
      0,
    );
    assert.deepEqual(subsequentCalls, expectedCommands);
    assert.equal(existsSync(marker), false);
  });

  test("releases the lock after policy failure and cleanup errors", () => {
    const repositoryRoot = createRepository();
    const policyCalls = [];
    assert.equal(
      runCoverage({
        repositoryRoot,
        spawn: (command, args) => {
          policyCalls.push([command, args]);
          return {
            status: policyCalls.length === expectedCommands.length ? 9 : 0,
            signal: null,
          };
        },
        writeError: () => {},
      }),
      9,
    );
    assert.deepEqual(policyCalls, expectedCommands);
    assert.equal(existsSync(lockFile(repositoryRoot)), false);

    const cleanupMessages = [];
    assert.equal(
      runCoverage({
        repositoryRoot,
        remove: () => {
          throw Object.assign(new Error("private cleanup details"), {
            code: "EACCES",
          });
        },
        spawn: () => assert.fail("cleanup failure must stop producers"),
        writeError: (message) => cleanupMessages.push(message),
      }),
      1,
    );
    assert.deepEqual(cleanupMessages, ["coverage cleanup failed: EACCES"]);
    assert.equal(existsSync(lockFile(repositoryRoot)), false);

    assert.equal(
      runCoverage({
        repositoryRoot,
        spawn: () => ({ status: 0, signal: null }),
      }),
      0,
    );
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

    const thrownMessages = [];
    assert.equal(
      runCoverage({
        repositoryRoot,
        spawn: () => {
          throw Object.assign(new Error("private spawn details"), {
            code: "EIO",
          });
        },
        writeError: (message) => thrownMessages.push(message),
      }),
      1,
    );
    assert.deepEqual(thrownMessages, [
      "coverage:ground-codes failed to start: EIO",
    ]);
    assert.equal(existsSync(lockFile(repositoryRoot)), false);

    assert.equal(
      runCoverage({
        repositoryRoot,
        spawn: () => ({ status: 0, signal: null }),
      }),
      0,
    );
  });

  test("derives the default repository root from the script location", () => {
    assert.equal(
      REPOSITORY_ROOT,
      fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, ""),
    );
  });
});
