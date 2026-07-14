import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  COVERAGE_BRANCH_TARGETS,
  mergeBranchCoverage,
} from "./merge-branch-coverage.mjs";
import { parseLcov } from "./coverage-policy.mjs";

const block = (source, records) =>
  [`SF:${source}`, ...records, "end_of_record"].join("\n");

const bunBlock = (source) =>
  block(source, ["FNF:1", "FNH:1", "DA:1,1", "LF:1", "LH:1"]);

const branchBlock = (source, hits = [1, 0]) =>
  block(source, [
    `BRDA:1,0,0,${hits[0]}`,
    `BRDA:1,0,1,${hits[1]}`,
    "BRF:2",
    `BRH:${hits.filter(Boolean).length}`,
  ]);

describe("branch coverage merger", () => {
  test("defines every maintained API source and the exact Web target", () => {
    assert.equal(COVERAGE_BRANCH_TARGETS.api.sources.length, 22);
    assert.deepEqual(COVERAGE_BRANCH_TARGETS.web.sources, [
      "apps/web/lib/code/ground-codes.ts",
      "apps/web/lib/code/share-url.ts",
      "apps/web/lib/i18n/ground-code-language.ts",
      "apps/web/lib/map/celestial-bodies.ts",
      "apps/web/lib/map/google-maps-availability.ts",
      "apps/web/hooks/use-disable-zoom.ts",
    ]);
  });

  test("preserves Bun line/function records and adds only validated branches", () => {
    const sources = ["src/one.ts", "src/two.ts"];
    const merged = mergeBranchCoverage({
      bunLcov: sources.map(bunBlock).join("\n"),
      branchLcov: sources.map((source) => branchBlock(source)).join("\n"),
      expectedSources: sources,
      repositoryRoot: process.cwd(),
    });

    assert.match(merged, /FNF:1\nFNH:1\nDA:1,1\nLF:1\nLH:1/);
    assert.match(merged, /BRDA:1,0,0,1\nBRDA:1,0,1,0\nBRF:2\nBRH:1/);
    const parsed = parseLcov(merged);
    assert.equal(parsed.get("src/one.ts")?.lines.size, 1);
    assert.equal(parsed.get("src/one.ts")?.functions.size, 0);
    assert.equal(parsed.get("src/one.ts")?.branches.size, 2);
  });

  test("validates c8 branches independently of same-line transform functions", () => {
    const c8Block = block("src/one.ts", [
      "FN:1,<static_initializer>",
      "FN:1,<static_initializer>",
      "FNF:2",
      "FNH:2",
      "FNDA:1,<static_initializer>",
      "FNDA:1,<static_initializer>",
      "DA:1,1",
      "LF:1",
      "LH:1",
      "BRDA:1,0,0,1",
      "BRF:1",
      "BRH:1",
    ]);

    assert.doesNotThrow(() =>
      mergeBranchCoverage({
        bunLcov: bunBlock("src/one.ts"),
        branchLcov: c8Block,
        expectedSources: ["src/one.ts"],
      }),
    );
  });

  test("replaces stale branch blocks when the merger is rerun", () => {
    const merged = mergeBranchCoverage({
      bunLcov: block("src/one.ts", [
        "FNF:1",
        "FNH:1",
        "DA:1,1",
        "LF:1",
        "LH:1",
        "BRDA:1,0,0,0",
        "BRF:1",
        "BRH:0",
      ]),
      branchLcov: branchBlock("src/one.ts", [1, 0]),
      expectedSources: ["src/one.ts"],
    });

    assert.doesNotMatch(merged, /BRDA:1,0,0,0/);
    assert.equal(merged.match(/BRF:/g)?.length, 1);
    assert.equal(parseLcov(merged).get("src/one.ts")?.branches.get("1,0,0"), 1);
  });

  test("rejects absent, unexpected, branchless, and truncated sources", () => {
    const cases = [
      {
        name: "missing Bun source",
        bunLcov: bunBlock("src/one.ts"),
        branchLcov: branchBlock("src/one.ts"),
        expectedSources: ["src/one.ts", "src/two.ts"],
        expected: /Bun LCOV missing source src\/two\.ts/,
      },
      {
        name: "unexpected branch source",
        bunLcov: bunBlock("src/one.ts"),
        branchLcov: [
          branchBlock("src/one.ts"),
          branchBlock("src/extra.ts"),
        ].join("\n"),
        expectedSources: ["src/one.ts"],
        expected: /branch LCOV source mismatch: src\/extra\.ts/,
      },
      {
        name: "branchless source",
        bunLcov: bunBlock("src/one.ts"),
        branchLcov: block("src/one.ts", ["DA:1,1", "LF:1", "LH:1"]),
        expectedSources: ["src/one.ts"],
        expected: /branch LCOV has no branch summary for src\/one\.ts/,
      },
      {
        name: "truncated source",
        bunLcov: bunBlock("src/one.ts"),
        branchLcov: "SF:src/one.ts\nBRDA:1,0,0,1",
        expectedSources: ["src/one.ts"],
        expected: /branch LCOV is invalid: LCOV record missing end_of_record/,
      },
    ];

    for (const fixture of cases) {
      assert.throws(
        () =>
          mergeBranchCoverage({
            bunLcov: fixture.bunLcov,
            branchLcov: fixture.branchLcov,
            expectedSources: fixture.expectedSources,
            repositoryRoot: process.cwd(),
          }),
        fixture.expected,
        fixture.name,
      );
    }
  });

  test("rejects a target whose c8 report has no detailed branches", () => {
    assert.throws(
      () =>
        mergeBranchCoverage({
          bunLcov: bunBlock("src/one.ts"),
          branchLcov: block("src/one.ts", ["BRF:0", "BRH:0"]),
          expectedSources: ["src/one.ts"],
        }),
      /branch LCOV target has no detailed branches/,
    );
  });
});
