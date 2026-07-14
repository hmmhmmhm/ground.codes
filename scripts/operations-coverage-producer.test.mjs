import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootPackage = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

test("operations coverage instruments only maintained policy modules", () => {
  assert.equal(
    rootPackage.scripts["coverage:operations"],
    [
      "c8 --all",
      "--include scripts/production-audit-policy.mjs",
      "--include scripts/production-smoke-helpers.mjs",
      "--include scripts/production-smoke-profiles.mjs",
      "--include scripts/workflow-test-helpers.mjs",
      "--include scripts/github-governance.mjs",
      "--include scripts/coverage-policy.mjs",
      "--reporter=lcov --reporter=text --reports-dir coverage/operations",
      "node --test",
      "scripts/production-audit-policy.test.mjs",
      "scripts/production-smoke.test.mjs",
      "scripts/qa-workflow-policy.test.mjs",
      "scripts/qa-workflows.test.mjs",
      "scripts/github-governance.test.mjs",
      "scripts/coverage-policy.test.mjs",
      "scripts/coverage-policy-hardening.test.mjs",
      "scripts/coverage-policy-summary.test.mjs",
    ].join(" "),
  );
});
