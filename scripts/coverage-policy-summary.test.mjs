import assert from "node:assert/strict";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, test } from "node:test";

import {
  collectTargetCoverage,
  evaluateCoveragePolicy,
  parseLcov,
} from "./coverage-policy.mjs";

const repositoryRoot = join(tmpdir(), "coverage-summary-root");
const policyTarget = {
  lcov: "coverage/bun/lcov.info",
  include: ["src/runtime.ts"],
  exclude: [],
  minimum: { line: 0, function: 0, branch: 0 },
};

const block = (records) =>
  ["SF:src/runtime.ts", ...records, "end_of_record"].join("\n");

const collect = (lcov) =>
  collectTargetCoverage({
    name: "bun",
    target: policyTarget,
    records: parseLcov(lcov, { repositoryRoot }),
    sourceFiles: ["src/runtime.ts"],
    repositoryRoot,
  });

describe("summary-only LCOV metrics", () => {
  test("evaluates Bun function summaries alongside detailed line records", () => {
    const bunLcov = block([
      "FNF:3",
      "FNH:2",
      "DA:1,4",
      "DA:2,0",
      "LF:2",
      "LH:1",
    ]);
    const result = evaluateCoveragePolicy(
      { schemaVersion: 1, targets: { bun: policyTarget } },
      {
        repositoryRoot,
        reports: { [policyTarget.lcov]: bunLcov },
        sourceFiles: ["src/runtime.ts"],
      },
    );

    assert.deepEqual(result.targets[0].metrics.function, {
      covered: 2,
      total: 3,
      ratio: 2 / 3,
    });
    assert.deepEqual(result.targets[0].metrics.line, {
      covered: 1,
      total: 2,
      ratio: 0.5,
    });
    assert.deepEqual(result.targets[0].errors, [
      "branch metric has no records",
    ]);
  });

  test("uses complete summary-only pairs for every metric type", () => {
    const result = collect(
      block(["FNF:3", "FNH:2", "LF:5", "LH:4", "BRF:2", "BRH:1"]),
    );

    assert.deepEqual(result.metrics, {
      line: { covered: 4, total: 5, ratio: 0.8 },
      function: { covered: 2, total: 3, ratio: 2 / 3 },
      branch: { covered: 1, total: 2, ratio: 0.5 },
    });
  });

  test("rejects summary hits greater than the declared total", () => {
    for (const [total, hit] of [
      ["FNF:2", "FNH:3"],
      ["LF:2", "LH:3"],
      ["BRF:2", "BRH:3"],
    ]) {
      assert.throws(
        () => parseLcov(block([total, hit]), { repositoryRoot }),
        /summary hits exceed total/,
      );
    }
  });

  test("deduplicates repeated identical summary-only blocks", () => {
    const lcov = [block(["FNF:4", "FNH:2"]), block(["FNF:4", "FNH:2"])].join(
      "\n",
    );

    assert.deepEqual(collect(lcov).metrics.function, {
      covered: 2,
      total: 4,
      ratio: 0.5,
    });
  });

  test("merges repeated coverage conservatively without assuming disjoint identities", () => {
    const lcov = [block(["FNF:4", "FNH:2"]), block(["FNF:4", "FNH:3"])].join(
      "\n",
    );

    assert.deepEqual(collect(lcov).metrics.function, {
      covered: 3,
      total: 4,
      ratio: 0.75,
    });
  });

  test("rejects changing totals and mixed known or unknown identities across blocks", () => {
    const cases = [
      [block(["FNF:4", "FNH:2"]), block(["FNF:5", "FNH:2"])],
      [
        block(["FNF:1", "FNH:1"]),
        block(["FN:1,run", "FNDA:1,run", "FNF:1", "FNH:1"]),
      ],
    ];

    for (const records of cases) {
      assert.throws(
        () => parseLcov(records.join("\n"), { repositoryRoot }),
        /cannot safely merge summary-only function coverage/,
      );
    }
  });
});
