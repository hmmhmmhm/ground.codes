import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  collectTargetCoverage,
  evaluateCoveragePolicy,
  parseLcov,
} from "./coverage-policy.mjs";

const repositoryRoot = join(tmpdir(), "coverage-hardening-root");
const cliPath = fileURLToPath(new URL("./check-coverage.mjs", import.meta.url));

const completeLcov = (source = "src/runtime.ts") =>
  [
    `SF:${source}`,
    "FN:1,run",
    "FNDA:1,run",
    "DA:1,1",
    "BRDA:1,0,0,1",
    "end_of_record",
  ].join("\n");

const target = (overrides = {}) => ({
  lcov: "coverage/example/lcov.info",
  include: ["src/runtime.ts"],
  exclude: [],
  minimum: { line: 1, function: 1, branch: 1 },
  ...overrides,
});

describe("LCOV parser hardening", () => {
  test("tracks repeated same-name function occurrences by their declared lines", () => {
    const block = (firstHits, secondHits) =>
      [
        "SF:src/runtime.ts",
        "FN:1,sameName",
        "FN:5,sameName",
        `FNDA:${firstHits},sameName`,
        `FNDA:${secondHits},sameName`,
        "FNF:2",
        "FNH:2",
        "DA:1,1",
        "LF:1",
        "LH:1",
        "BRDA:1,0,0,1",
        "BRF:1",
        "BRH:1",
        "end_of_record",
      ].join("\n");
    const lcov = [block(1, 0), block(0, 2)].join("\n");
    const result = collectTargetCoverage({
      name: "example",
      target: target(),
      records: parseLcov(lcov, { repositoryRoot }),
      sourceFiles: ["src/runtime.ts"],
      repositoryRoot,
    });

    assert.deepEqual(result.metrics.function, {
      covered: 2,
      total: 2,
      ratio: 1,
    });
    assert.equal(result.ok, true);
  });

  test("rejects malformed, out-of-order, and truncated LCOV records", () => {
    const cases = [
      ["empty source", "SF:\nend_of_record", /invalid SF source/],
      [
        "outside source",
        `SF:${join(repositoryRoot, "..", "outside.ts")}\nend_of_record`,
        /outside repository/,
      ],
      ["metric before source", "DA:1,1", /DA record before SF/],
      [
        "nested source",
        "SF:src/a.ts\nSF:src/b.ts\nend_of_record",
        /SF record before end_of_record/,
      ],
      ["truncated record", "SF:src/a.ts\nDA:1,1", /missing end_of_record/],
      ["decimal line", "SF:src/a.ts\nDA:1.5,1\nend_of_record", /invalid DA/],
      ["exponent hit", "SF:src/a.ts\nDA:1,1e2\nend_of_record", /invalid DA/],
      ["blank hit", "SF:src/a.ts\nDA:1,\nend_of_record", /invalid DA/],
      ["extra DA field", "SF:src/a.ts\nDA:1,1,x\nend_of_record", /invalid DA/],
      [
        "zero function line",
        "SF:src/a.ts\nFN:0,run\nend_of_record",
        /invalid FN/,
      ],
      ["blank function", "SF:src/a.ts\nFN:1,\nend_of_record", /invalid FN/],
      [
        "unknown function data",
        "SF:src/a.ts\nFNDA:1,run\nend_of_record",
        /FNDA has no matching FN/,
      ],
      [
        "extra function data",
        "SF:src/a.ts\nFN:1,run\nFNDA:1,run\nFNDA:1,run\nend_of_record",
        /FNDA has no matching FN/,
      ],
      [
        "zero branch line",
        "SF:src/a.ts\nBRDA:0,0,0,1\nend_of_record",
        /invalid BRDA/,
      ],
      [
        "negative block",
        "SF:src/a.ts\nBRDA:1,-1,0,1\nend_of_record",
        /invalid BRDA/,
      ],
      [
        "decimal branch",
        "SF:src/a.ts\nBRDA:1,0,0.5,1\nend_of_record",
        /invalid BRDA/,
      ],
      [
        "bad branch hit",
        "SF:src/a.ts\nBRDA:1,0,0,x\nend_of_record",
        /invalid BRDA/,
      ],
      [
        "metric after closure",
        "SF:src/a.ts\nend_of_record\nDA:1,1",
        /DA record before SF/,
      ],
      [
        "unknown content",
        "SF:src/a.ts\nwat\nend_of_record",
        /unknown LCOV record/,
      ],
    ];

    for (const [name, lcov, expected] of cases) {
      assert.throws(() => parseLcov(lcov, { repositoryRoot }), expected, name);
    }
  });
});

const writePolicy = (root, targets) => {
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "scripts", "coverage-policy.json"),
    JSON.stringify({ schemaVersion: 1, targets }),
  );
};

const runCli = (root) =>
  spawnSync(process.execPath, [cliPath], { cwd: root, encoding: "utf8" });

describe("coverage report file safety", () => {
  test("rejects absolute and repository-escaping report paths before reading", () => {
    const root = mkdtempSync(join(tmpdir(), "coverage-unsafe-policy-"));
    for (const lcov of [join(root, "outside.info"), "../outside.info"]) {
      writePolicy(root, { example: target({ lcov }) });
      const execution = runCli(root);

      assert.equal(execution.status, 1);
      assert.match(
        execution.stdout,
        /coverage FAIL invalid policy: example target has an unsafe LCOV report path/,
      );
      assert.equal(execution.stderr, "");
    }
  });

  test("reports unreadable and missing targets without masking readable targets", () => {
    const root = mkdtempSync(join(tmpdir(), "coverage-read-errors-"));
    for (const source of ["good", "bad", "missing"]) {
      mkdirSync(join(root, "src"), { recursive: true });
      writeFileSync(join(root, "src", `${source}.ts`), "export {};\n");
    }
    mkdirSync(join(root, "coverage", "good"), { recursive: true });
    mkdirSync(join(root, "coverage", "bad"), { recursive: true });
    writeFileSync(
      join(root, "coverage", "good", "lcov.info"),
      completeLcov("src/good.ts"),
    );
    writePolicy(root, {
      good: target({
        lcov: "coverage/good/lcov.info",
        include: ["src/good.ts"],
      }),
      bad: target({
        lcov: "coverage/bad",
        include: ["src/bad.ts"],
      }),
      missing: target({
        lcov: "coverage/missing/lcov.info",
        include: ["src/missing.ts"],
      }),
    });

    const execution = runCli(root);

    assert.equal(execution.status, 1);
    assert.match(
      execution.stdout,
      /^good PASS line=100\.00% function=100\.00% branch=100\.00%$/m,
    );
    assert.match(
      execution.stdout,
      /^bad FAIL unreadable LCOV report coverage\/bad$/m,
    );
    assert.match(
      execution.stdout,
      /^missing FAIL missing LCOV report coverage\/missing\/lcov\.info$/m,
    );
    assert.equal(execution.stdout.trim().split("\n").length, 3);
    assert.equal(execution.stderr, "");
  });

  test("rejects an existing report symlink that resolves outside the repository", () => {
    const root = mkdtempSync(join(tmpdir(), "coverage-report-link-"));
    const outside = join(
      dirname(root),
      `${root.split("/").at(-1)}-outside.info`,
    );
    mkdirSync(join(root, "coverage"));
    mkdirSync(join(root, "src"));
    writeFileSync(join(root, "src", "runtime.ts"), "export {};\n");
    writeFileSync(outside, completeLcov());
    symlinkSync(outside, join(root, "coverage", "linked.info"));
    writePolicy(root, {
      linked: target({ lcov: "coverage/linked.info" }),
    });

    const execution = runCli(root);

    assert.equal(execution.status, 1);
    assert.equal(
      execution.stdout,
      "linked FAIL unsafe LCOV report coverage/linked.info\n",
    );
    assert.equal(execution.stderr, "");
  });
});

describe("coverage pattern validation", () => {
  test("rejects bracket character classes instead of treating them as supported globs", () => {
    for (const configuredTarget of [
      target({ include: ["src/[ab].ts"] }),
      target({ exclude: ["src/[ab].generated.ts"] }),
    ]) {
      assert.throws(
        () =>
          evaluateCoveragePolicy({
            schemaVersion: 1,
            targets: { example: configuredTarget },
          }),
        /example target has an unsupported bracket glob pattern/,
      );
    }
  });
});
