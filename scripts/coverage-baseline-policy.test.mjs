import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readJson = (relativePath) =>
  JSON.parse(
    readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8"),
  );

test("coverage policy locks measured non-zero branch floors", () => {
  const policy = readJson("scripts/coverage-policy.json");
  assert.equal(policy.schemaVersion, 1);
  assert.deepEqual(Object.keys(policy.targets), [
    "ground-codes",
    "api",
    "web",
    "operations",
  ]);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(policy.targets).map(([name, target]) => [
        name,
        target.minimum,
      ]),
    ),
    {
      "ground-codes": { line: 0.8, function: 0.8, branch: 0.696 },
      api: { line: 0.8, function: 0.8, branch: 0.726 },
      web: { line: 0.8, function: 0.8, branch: 0.595 },
      operations: { line: 0.8, function: 0.8, branch: 0.872 },
    },
  );
  assert.deepEqual(policy.targets.web.include, [
    "apps/web/lib/code/ground-codes.ts",
    "apps/web/lib/code/share-url.ts",
    "apps/web/lib/i18n/ground-code-language.ts",
    "apps/web/lib/map/celestial-bodies.ts",
    "apps/web/lib/map/google-maps-availability.ts",
    "apps/web/hooks/use-disable-zoom.ts",
  ]);
  assert.deepEqual(policy.targets.operations.include, [
    "scripts/production-audit-policy.mjs",
    "scripts/production-smoke-helpers.mjs",
    "scripts/production-smoke-profiles.mjs",
    "scripts/workflow-test-helpers.mjs",
    "scripts/github-governance.mjs",
    "scripts/coverage-policy.mjs",
  ]);
});

test("coverage documentation records measurements, tools, boundaries, and ratchet rule", () => {
  const document = readFileSync(
    new URL("../docs/quality/coverage.md", import.meta.url),
    "utf8",
  );

  for (const expected of [
    "2026-07-14",
    "Bun\\s+1.3.1",
    "c8 11.0.0",
    "695/998",
    "255/351",
    "289/485",
    "431/494",
    "0.696",
    "0.726",
    "0.595",
    "0.872",
    "packages/ground-codes/src/**/*.ts",
    "apps/api-ground-codes/src/**/*.ts",
    "thresholds may only increase",
  ]) {
    assert.match(document, new RegExp(expected.replaceAll("*", "\\*")));
  }
});
