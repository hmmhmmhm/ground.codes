import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  collectTargetCoverage,
  evaluateCoveragePolicy,
  parseLcov,
} from "./coverage-policy.mjs";

const repositoryRoot = join(tmpdir(), "ground-codes-coverage-root");

const lcovRecord = ({
  source,
  lines = [[1, 1]],
  functions = [[1, "run", 1]],
  branches = [[1, 0, 0, 1]],
}) =>
  [
    `SF:${source}`,
    ...functions.map(([line, name]) => `FN:${line},${name}`),
    ...functions.map(([, name, hits]) => `FNDA:${hits},${name}`),
    ...lines.map(([line, hits]) => `DA:${line},${hits}`),
    ...branches.map(
      ([line, block, branch, hits]) =>
        `BRDA:${line},${block},${branch},${hits}`,
    ),
    "end_of_record",
  ].join("\n");

const target = ({
  lcov = "coverage/example/lcov.info",
  include = ["src/**/*.ts"],
  exclude = ["**/*.generated.ts"],
  minimum = { line: 0.5, function: 0.5, branch: 0.5 },
} = {}) => ({ lcov, include, exclude, minimum });

describe("LCOV policy", () => {
  test("normalizes absolute sources and aggregates line, function, and branch coverage", () => {
    const sourceRecord = (source) =>
      lcovRecord({
        source,
        lines: [
          [1, 1],
          [2, 0],
        ],
        functions: [
          [1, "covered", 2],
          [2, "uncovered", 0],
        ],
        branches: [
          [1, 0, 0, 1],
          [1, 0, 1, "-"],
        ],
      });
    const parsed = parseLcov(
      [
        sourceRecord(join(repositoryRoot, "src", "one.ts")),
        sourceRecord("src/two.ts"),
      ].join("\n"),
      { repositoryRoot },
    );

    const result = collectTargetCoverage({
      name: "example",
      target: target(),
      records: parsed,
      sourceFiles: ["src/one.ts", "src/two.ts"],
    });

    assert.deepEqual(result.metrics, {
      line: { covered: 2, total: 4, ratio: 0.5 },
      function: { covered: 2, total: 4, ratio: 0.5 },
      branch: { covered: 2, total: 4, ratio: 0.5 },
    });
    assert.deepEqual(result.files, ["src/one.ts", "src/two.ts"]);
    assert.equal(result.ok, true);
  });

  test("deduplicates repeated source and metric records", () => {
    const block = lcovRecord({
      source: "src/repeated.ts",
      lines: [
        [1, 0],
        [1, 1],
      ],
      functions: [
        [1, "run", 0],
        [1, "run", 1],
      ],
      branches: [
        [1, 0, 0, 0],
        [1, 0, 0, 1],
      ],
    });
    const parsed = parseLcov(`${block}\n${block}`, { repositoryRoot });
    const result = collectTargetCoverage({
      name: "example",
      target: target({ minimum: { line: 1, function: 1, branch: 1 } }),
      records: parsed,
      sourceFiles: ["src/repeated.ts"],
    });

    assert.deepEqual(result.metrics, {
      line: { covered: 1, total: 1, ratio: 1 },
      function: { covered: 1, total: 1, ratio: 1 },
      branch: { covered: 1, total: 1, ratio: 1 },
    });
  });

  test("reports every included maintained source missing from LCOV", () => {
    const result = collectTargetCoverage({
      name: "example",
      target: target(),
      records: parseLcov(lcovRecord({ source: "src/covered.ts" }), {
        repositoryRoot,
      }),
      sourceFiles: ["src/covered.ts", "src/missing.ts"],
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.errors, ["missing LCOV source src/missing.ts"]);
  });

  test("excludes generated sources without hiding ordinary maintained sources", () => {
    const result = collectTargetCoverage({
      name: "example",
      target: target(),
      records: parseLcov(lcovRecord({ source: "src/runtime.ts" }), {
        repositoryRoot,
      }),
      sourceFiles: [
        "src/runtime.ts",
        "src/table.generated.ts",
        "src/maintained.ts",
      ],
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.files, ["src/maintained.ts", "src/runtime.ts"]);
    assert.deepEqual(result.errors, ["missing LCOV source src/maintained.ts"]);
  });

  test("fails when an included glob matches no repository source", () => {
    const result = collectTargetCoverage({
      name: "example",
      target: target({ include: ["missing/**/*.ts"] }),
      records: new Map(),
      sourceFiles: ["src/one.ts"],
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.errors, [
      "include pattern missing/**/*.ts matched no source files",
      "line metric has no records",
      "function metric has no records",
      "branch metric has no records",
    ]);
  });

  test("accepts metrics exactly at the declared thresholds including fixture branch 0.731", () => {
    const branches = Array.from({ length: 1_000 }, (_, index) => [
      1,
      0,
      index,
      index < 731 ? 1 : 0,
    ]);
    const records = parseLcov(
      lcovRecord({
        source: "src/threshold.ts",
        lines: Array.from({ length: 10 }, (_, index) => [
          index + 1,
          index < 8 ? 1 : 0,
        ]),
        functions: Array.from({ length: 10 }, (_, index) => [
          index + 1,
          `function${index}`,
          index < 8 ? 1 : 0,
        ]),
        branches,
      }),
      { repositoryRoot },
    );
    const result = collectTargetCoverage({
      name: "ground-codes",
      target: target({
        include: ["src/threshold.ts"],
        minimum: { line: 0.8, function: 0.8, branch: 0.731 },
      }),
      records,
      sourceFiles: ["src/threshold.ts"],
    });

    assert.equal(result.ok, true);
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(result.metrics).map(([metric, value]) => [
          metric,
          value.ratio,
        ]),
      ),
      { line: 0.8, function: 0.8, branch: 0.731 },
    );
  });

  test("reports each metric below its target threshold", () => {
    const result = collectTargetCoverage({
      name: "example",
      target: target({ minimum: { line: 1, function: 1, branch: 1 } }),
      records: parseLcov(
        lcovRecord({
          source: "src/low.ts",
          lines: [
            [1, 1],
            [2, 0],
          ],
          functions: [
            [1, "covered", 1],
            [2, "missed", 0],
          ],
          branches: [
            [1, 0, 0, 1],
            [1, 0, 1, 0],
          ],
        }),
        { repositoryRoot },
      ),
      sourceFiles: ["src/low.ts"],
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.errors, [
      "line 0.500000 is below 1.000000",
      "function 0.500000 is below 1.000000",
      "branch 0.500000 is below 1.000000",
    ]);
  });

  test("evaluates four targets independently instead of averaging the repository", () => {
    const targets = Object.fromEntries(
      ["ground-codes", "api", "web", "operations"].map((name) => [
        name,
        target({
          lcov: `coverage/${name}/lcov.info`,
          include: [`src/${name}.ts`],
          exclude: [],
          minimum: { line: 0.8, function: 0.8, branch: 0.8 },
        }),
      ]),
    );
    const reports = Object.fromEntries(
      Object.entries(targets).map(([name, value]) => [
        value.lcov,
        lcovRecord({
          source: `src/${name}.ts`,
          lines: [
            [1, 1],
            [2, name === "web" ? 0 : 1],
          ],
          functions: [[1, "run", 1]],
          branches: [[1, 0, 0, 1]],
        }),
      ]),
    );

    const result = evaluateCoveragePolicy(
      { schemaVersion: 1, targets },
      {
        repositoryRoot,
        reports,
        sourceFiles: Object.keys(targets).map((name) => `src/${name}.ts`),
      },
    );

    assert.equal(result.ok, false);
    assert.deepEqual(
      result.targets.map(({ name, ok }) => ({ name, ok })),
      [
        { name: "ground-codes", ok: true },
        { name: "api", ok: true },
        { name: "web", ok: false },
        { name: "operations", ok: true },
      ],
    );
    assert.deepEqual(result.targets[2].errors, [
      "line 0.500000 is below 0.800000",
    ]);
  });

  test("reports a missing target report without masking other targets", () => {
    const policy = {
      schemaVersion: 1,
      targets: {
        api: target({
          lcov: "coverage/api/lcov.info",
          include: ["src/api.ts"],
        }),
        web: target({
          lcov: "coverage/web/lcov.info",
          include: ["src/web.ts"],
        }),
      },
    };
    const result = evaluateCoveragePolicy(policy, {
      repositoryRoot,
      reports: {
        "coverage/api/lcov.info": lcovRecord({ source: "src/api.ts" }),
      },
      sourceFiles: ["src/api.ts", "src/web.ts"],
    });

    assert.equal(result.ok, false);
    assert.equal(result.targets[0].ok, true);
    assert.deepEqual(result.targets[1].errors, [
      "missing LCOV report coverage/web/lcov.info",
    ]);
  });
});

describe("coverage checker CLI", () => {
  const cliPath = fileURLToPath(
    new URL("./check-coverage.mjs", import.meta.url),
  );

  test("prints one compact line per target and exits non-zero on failures", () => {
    const root = mkdtempSync(join(tmpdir(), "coverage-policy-cli-"));
    mkdirSync(join(root, "scripts"));
    mkdirSync(join(root, "src"));
    for (const directory of ["api", "core", "operations"]) {
      mkdirSync(join(root, "coverage", directory), { recursive: true });
    }
    writeFileSync(join(root, "src", "api.ts"), "export const api = true;\n");
    writeFileSync(join(root, "src", "core.ts"), "export const core = true;\n");
    writeFileSync(
      join(root, "src", "operations.ts"),
      "export const operations = true;\n",
    );
    writeFileSync(join(root, "src", "web.ts"), "export const web = true;\n");
    writeFileSync(
      join(root, "coverage", "api", "lcov.info"),
      lcovRecord({ source: "src/api.ts" }),
    );
    writeFileSync(
      join(root, "coverage", "core", "lcov.info"),
      lcovRecord({ source: "src/not-core.ts" }),
    );
    writeFileSync(
      join(root, "coverage", "operations", "lcov.info"),
      ["SF:src/operations.ts", "DA:1,1", "end_of_record"].join("\n"),
    );
    writeFileSync(
      join(root, "scripts", "coverage-policy.json"),
      JSON.stringify({
        schemaVersion: 1,
        targets: {
          api: target({
            lcov: "coverage/api/lcov.info",
            include: ["src/api.ts"],
          }),
          core: target({
            lcov: "coverage/core/lcov.info",
            include: ["src/core.ts"],
          }),
          operations: target({
            lcov: "coverage/operations/lcov.info",
            include: ["src/operations.ts"],
          }),
          web: target({
            lcov: "coverage/web/lcov.info",
            include: ["src/web.ts"],
          }),
        },
      }),
    );

    const execution = spawnSync(process.execPath, [cliPath], {
      cwd: root,
      encoding: "utf8",
    });

    assert.equal(execution.status, 1);
    assert.match(
      execution.stdout,
      /^api PASS line=100\.00% function=100\.00% branch=100\.00%$/m,
    );
    assert.match(
      execution.stdout,
      /^core FAIL missing LCOV source src\/core\.ts; line metric has no records; function metric has no records; branch metric has no records$/m,
    );
    assert.match(
      execution.stdout,
      /^operations FAIL function metric has no records; branch metric has no records$/m,
    );
    assert.match(
      execution.stdout,
      /^web FAIL missing LCOV report coverage\/web\/lcov\.info$/m,
    );
    assert.equal(execution.stdout.trim().split("\n").length, 4);
    assert.equal(execution.stderr, "");
  });

  test("fails clearly when the future repository policy is not present", () => {
    const root = mkdtempSync(join(tmpdir(), "coverage-policy-missing-"));
    const execution = spawnSync(process.execPath, [cliPath], {
      cwd: root,
      encoding: "utf8",
    });

    assert.equal(execution.status, 1);
    assert.equal(
      execution.stdout,
      "coverage FAIL missing policy scripts/coverage-policy.json\n",
    );
    assert.equal(execution.stderr, "");
  });
});
