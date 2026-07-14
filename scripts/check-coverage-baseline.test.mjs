import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { runCoverageCheck } from "./check-coverage.mjs";

const createRepository = () => {
  const root = mkdtempSync(join(tmpdir(), "coverage-baseline-"));
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "coverage", "example"), { recursive: true });
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(
    join(root, "src", "runtime.ts"),
    "export const run = () => 1;\n",
  );
  const policyFile = join(root, "scripts", "coverage-policy.json");
  writeFileSync(
    policyFile,
    JSON.stringify({
      schemaVersion: 1,
      targets: {
        example: {
          lcov: "coverage/example/lcov.info",
          include: ["src/runtime.ts"],
          exclude: [],
          minimum: { line: 1, function: 1, branch: 1 },
        },
      },
    }),
  );
  writeFileSync(
    join(root, "coverage", "example", "lcov.info"),
    [
      "SF:src/runtime.ts",
      "FN:1,run",
      "FNDA:1,run",
      "FNF:1",
      "FNH:1",
      "DA:1,1",
      "DA:2,0",
      "LF:2",
      "LH:1",
      "BRDA:1,0,0,1",
      "BRDA:1,0,1,0",
      "BRF:2",
      "BRH:1",
      "end_of_record",
    ].join("\n"),
  );
  return { root, policyFile };
};

test("baseline mode prints exact fractions without writing policy", () => {
  const { root, policyFile } = createRepository();
  const before = readFileSync(policyFile, "utf8");
  const output = [];

  const status = runCoverageCheck({
    repositoryRoot: root,
    reportBaseline: true,
    write: (line) => output.push(line),
  });

  assert.equal(status, 0);
  assert.deepEqual(output, [
    "example baseline line=1/2=0.5 function=1/1=1 branch=1/2=0.5",
  ]);
  assert.equal(readFileSync(policyFile, "utf8"), before);
});

test("baseline mode fails rather than printing non-finite metrics", () => {
  const { root } = createRepository();
  const report = join(root, "coverage", "example", "lcov.info");
  writeFileSync(
    report,
    [
      "SF:src/runtime.ts",
      "FNF:1",
      "FNH:1",
      "DA:1,1",
      "LF:1",
      "LH:1",
      "end_of_record",
    ].join("\n"),
  );
  const output = [];

  assert.equal(
    runCoverageCheck({
      repositoryRoot: root,
      reportBaseline: true,
      write: (line) => output.push(line),
    }),
    1,
  );
  assert.match(output[0], /branch metric has no records/);
});
