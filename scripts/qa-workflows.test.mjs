import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const readText = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const readJson = (path) => JSON.parse(readText(path));

describe("QA workflow split", () => {
  test("keeps default CI on the lightweight browser smoke script", () => {
    const webPackage = readJson("../apps/web/package.json");
    const ciWorkflow = readText("../.github/workflows/ci.yml");

    assert.equal(
      webPackage.scripts["test:e2e:smoke"],
      "playwright test e2e/ground-code-share.spec.ts --grep @smoke",
    );
    assert.equal(webPackage.scripts["test:e2e:full"], "playwright test");
    assert.equal(
      readJson("../package.json").scripts["data:report-labels"],
      "node scripts/url-label-report.mjs",
    );
    assert.match(ciWorkflow, /pnpm --filter web test:e2e:smoke/);
    assert.match(ciWorkflow, /pnpm data:report-labels/);
    assert.doesNotMatch(ciWorkflow, /pnpm --filter web test:e2e\s*$/m);
  });

  test("provides a manual visual QA workflow with screenshot artifacts", () => {
    const visualWorkflow = readText("../.github/workflows/visual-qa.yml");

    assert.match(visualWorkflow, /workflow_dispatch:/);
    assert.match(visualWorkflow, /pnpm --filter web qa:visual/);
    assert.match(visualWorkflow, /actions\/upload-artifact@v5/);
    assert.match(visualWorkflow, /apps\/web\/test-results/);
  });
});

describe("production smoke workflow triggers", () => {
  test("runs after web deployment and writes a step summary", () => {
    const smokeWorkflow = readText("../.github/workflows/production-smoke.yml");
    const smokeScript = readText("./production-smoke.mjs");

    assert.match(smokeWorkflow, /workflow_run:/);
    assert.match(smokeWorkflow, /Deploy Web to Cloudflare Pages/);
    assert.match(smokeWorkflow, /github\.event\.workflow_run\.conclusion == 'success'/);
    assert.match(smokeScript, /GITHUB_STEP_SUMMARY/);
  });
});
