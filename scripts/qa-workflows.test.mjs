import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const readText = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const readJson = (path) => JSON.parse(readText(path));

describe("QA workflow split", () => {
  test("enforces format lint and build gates in CI", () => {
    const ciWorkflow = readText("../.github/workflows/ci.yml");

    for (const command of ["pnpm format:check", "pnpm lint", "pnpm build"]) {
      assert.match(ciWorkflow, new RegExp(command));
    }
  });

  test("keeps default CI on the lightweight browser smoke script", () => {
    const webPackage = readJson("../apps/web/package.json");
    const ciWorkflow = readText("../.github/workflows/ci.yml");

    assert.equal(
      webPackage.scripts["test:e2e:smoke"],
      "playwright test e2e/ground-code-share.spec.ts --grep @smoke",
    );
    assert.equal(
      webPackage.scripts["test:e2e:layout"],
      "playwright test e2e/ground-code-share.spec.ts --grep @layout",
    );
    assert.equal(webPackage.scripts["test:e2e:full"], "playwright test");
    assert.equal(
      readJson("../package.json").scripts["data:report-labels"],
      "node scripts/url-label-report.mjs",
    );
    assert.equal(
      readJson("../package.json").scripts["language:quality-score"],
      "node scripts/language-quality-score-report.mjs",
    );
    assert.match(ciWorkflow, /pnpm --filter web test:e2e:smoke/);
    assert.match(ciWorkflow, /pnpm data:report-labels/);
    assert.doesNotMatch(ciWorkflow, /pnpm --filter web test:e2e\s*$/m);
  });

  test("keeps the 180-language audit wired to the full quality gate", () => {
    const languageAudit = readJson("../package.json").scripts["language:audit"];

    assert.match(languageAudit, /language-quality-status-report\.mjs/);
    assert.match(languageAudit, /--assert-current/);
    assert.match(languageAudit, /language-quality-score-report\.mjs/);
    assert.match(languageAudit, /--assert-min 80/);
    assert.match(languageAudit, /language-expansion-target-report\.mjs/);
    assert.match(languageAudit, /--assert-complete/);
    assert.match(languageAudit, /language-support-completeness\.test\.mjs/);
    assert.match(languageAudit, /codebook-policy-audit\.test\.mjs/);
    assert.match(languageAudit, /address-gap-codebook-quality\.test\.mjs/);
    assert.match(languageAudit, /region-label-quality\.test\.mjs/);
    assert.match(languageAudit, /--filter web check-types/);
  });

  test("provides a manual visual QA workflow with screenshot artifacts", () => {
    const visualWorkflow = readText("../.github/workflows/visual-qa.yml");

    assert.match(visualWorkflow, /workflow_dispatch:/);
    assert.match(visualWorkflow, /pnpm --filter web test:e2e:layout/);
    assert.match(visualWorkflow, /pnpm --filter web qa:visual/);
    assert.match(visualWorkflow, /actions\/upload-artifact@v7/);
    assert.match(visualWorkflow, /apps\/web\/test-results/);
  });
});

describe("production smoke workflow triggers", () => {
  test("runs after web deployment and writes a step summary", () => {
    const smokeWorkflow = readText("../.github/workflows/production-smoke.yml");
    const smokeScript = readText("./production-smoke.mjs");

    assert.match(smokeWorkflow, /workflow_run:/);
    assert.match(smokeWorkflow, /force_failure:/);
    assert.match(smokeWorkflow, /GROUND_CODES_SMOKE_FORCE_FAILURE/);
    assert.match(smokeWorkflow, /Deploy Web to Cloudflare Pages/);
    assert.match(smokeWorkflow, /issues: write/);
    assert.match(smokeWorkflow, /actions\/github-script@v8/);
    assert.match(smokeWorkflow, /MOSHI_WEBHOOK_TOKEN is not configured/);
    assert.match(
      smokeWorkflow,
      /github\.event\.workflow_run\.conclusion == 'success'/,
    );
    assert.match(smokeScript, /GITHUB_STEP_SUMMARY/);
    assert.match(smokeScript, /GROUND_CODES_SMOKE_FORCE_FAILURE/);
  });
});

describe("API deployment workflow", () => {
  test("deploys Worker after API data changes and refreshes changed region datasets", () => {
    const deployApiWorkflow = readText("../.github/workflows/deploy-api.yml");

    assert.match(deployApiWorkflow, /Deploy API to Cloudflare Workers/);
    assert.match(deployApiWorkflow, /packages\/geoint\/region-dist\/\*\*/);
    assert.match(deployApiWorkflow, /packages\/codebook\/codebook-dist\/\*\*/);
    assert.match(deployApiWorkflow, /data:apply-postgis-schema/);
    assert.match(deployApiWorkflow, /list-changed-region-datasets\.mjs/);
    assert.match(deployApiWorkflow, /REGION_IMPORT_MODE=replace/);
    assert.match(deployApiWorkflow, /wrangler deploy/);
    assert.match(
      deployApiWorkflow,
      /--config apps\/api-ground-codes\/wrangler\.toml/,
    );
    assert.match(deployApiWorkflow, /--keep-vars/);
    assert.match(deployApiWorkflow, /--var API_RUNTIME_TAG:workspace/);
    assert.match(
      deployApiWorkflow,
      /--var GIT_COMMIT_SHA:\$\{\{ github\.sha \}\}/,
    );
    assert.match(deployApiWorkflow, /pnpm production:smoke/);
  });
});
