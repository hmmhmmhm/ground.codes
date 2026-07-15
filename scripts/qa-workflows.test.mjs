import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, test } from "node:test";

import {
  indentedYamlBlock,
  readJson,
  readText,
  workflowStep,
} from "./workflow-test-helpers.mjs";

const deploymentJob = (workflow) => {
  const jobs = indentedYamlBlock(workflow, "jobs");
  assert.match(
    jobs,
    /^  deploy:\s*$/m,
    "deploy must be a direct child of jobs",
  );
  return indentedYamlBlock(jobs, "deploy");
};

const workflowConcurrency = (workflow) => {
  assert.match(
    workflow,
    /^concurrency:\s*$/m,
    "concurrency must be configured at workflow level",
  );
  return indentedYamlBlock(workflow, "concurrency");
};

describe("QA workflow split", () => {
  test("enforces format lint and build gates in CI", () => {
    const ciWorkflow = readText("../.github/workflows/ci.yml");
    for (const command of [
      "pnpm format:check",
      "pnpm code:size-check",
      "pnpm lint",
      "pnpm build",
    ]) {
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
    assert.match(visualWorkflow, /actions\/upload-artifact@/);
    assert.match(visualWorkflow, /apps\/web\/test-results/);
  });
});

describe("CI security gate order", () => {
  test("runs audit and governance checks before expensive verification", () => {
    const ciWorkflow = readText("../.github/workflows/ci.yml");
    const verifyJob = indentedYamlBlock(ciWorkflow, "verify");
    const rootScripts = readJson("../package.json").scripts;

    assert.equal(
      rootScripts["scripts:test"],
      "node --test scripts/*.test.mjs scripts/region-data/*.test.mjs apps/api-ground-codes/scripts/*.test.mjs",
    );
    for (const testPath of [
      "./api-runtime-pins.test.mjs",
      "./check-production-audit.test.mjs",
      "./github-governance.test.mjs",
      "./production-audit-policy.test.mjs",
      "./qa-workflow-policy.test.mjs",
      "./qa-workflows.test.mjs",
    ]) {
      assert.ok(
        existsSync(new URL(testPath, import.meta.url)),
        `${testPath} must remain covered by pnpm scripts:test`,
      );
    }

    assert.match(
      verifyJob,
      /- name: Install dependencies\n\s+run: pnpm install --frozen-lockfile\n\n\s+- name: Audit production dependencies\n\s+run: pnpm security:audit/,
    );

    const orderedCommands = [
      "pnpm install --frozen-lockfile",
      "pnpm security:audit",
      "pnpm runtime:check-pins",
      "pnpm scripts:test",
      "pnpm build",
      "pnpm --filter web exec playwright install --with-deps chromium",
      "pnpm --filter web test:e2e:smoke",
    ];
    const indexes = orderedCommands.map((command) =>
      verifyJob.indexOf(command),
    );

    indexes.forEach((index, position) => {
      assert.notEqual(index, -1, `${orderedCommands[position]} is required`);
      if (position > 0) {
        assert.ok(
          indexes[position - 1] < index,
          `${orderedCommands[position - 1]} must run before ${orderedCommands[position]}`,
        );
      }
    });
  });
});

describe("CI coverage gate", () => {
  test("runs the authoritative uncached coverage command after tests and before build", () => {
    const ciWorkflow = readText("../.github/workflows/ci.yml");
    const verifyJob = indentedYamlBlock(ciWorkflow, "verify");
    const coverageStep = workflowStep(ciWorkflow, "Enforce coverage policy");
    const rootPackage = readJson("../package.json");
    const turbo = readJson("../turbo.json");

    assert.equal(rootPackage.scripts.coverage, "node scripts/run-coverage.mjs");
    assert.match(coverageStep, /^\s+run: pnpm coverage\s*$/m);
    assert.doesNotMatch(rootPackage.scripts.coverage, /turbo/);
    assert.ok(turbo.tasks.build.outputs.includes("!coverage/**"));
    assert.match(readText("../.gitignore"), /^coverage\/?$/m);

    const orderedCommands = [
      "pnpm --filter ground-codes test",
      "pnpm --filter ground-codes test:standalone",
      "pnpm --filter api-ground-codes test",
      "pnpm --filter web test",
      "pnpm coverage",
      "pnpm build",
    ];
    const indexes = orderedCommands.map((command) =>
      verifyJob.indexOf(command),
    );

    indexes.forEach((index, position) => {
      assert.notEqual(index, -1, `${orderedCommands[position]} is required`);
      if (position > 0) {
        assert.ok(
          indexes[position - 1] < index,
          `${orderedCommands[position - 1]} must run before ${orderedCommands[position]}`,
        );
      }
    });
  });
});

describe("production smoke workflow triggers", () => {
  const smokeWorkflow = readText("../.github/workflows/production-smoke.yml");
  test("configures scheduled profiles and lean checkout", () => {
    const schedule = indentedYamlBlock(smokeWorkflow, "schedule");
    const profileInput = indentedYamlBlock(smokeWorkflow, "profile");
    const checkoutStep = workflowStep(smokeWorkflow, "Checkout repository");
    const smokeJob = indentedYamlBlock(smokeWorkflow, "smoke");
    const concurrency = indentedYamlBlock(smokeWorkflow, "concurrency");
    const profileOptions = [
      ...profileInput.matchAll(/^\s+- ([^\s]+)\s*$/gm),
    ].map((match) => match[1]);
    const cronEntries = [
      ...schedule.matchAll(/^\s+- cron: ["']([^"']+)["']\s*$/gm),
    ].map((match) => match[1]);

    assert.deepEqual(cronEntries, ["*/30 * * * *", "17 3 * * *"]);
    assert.deepEqual(profileOptions, ["full", "quick"]);
    assert.match(profileInput, /type: choice[\s\S]*default: full/);
    for (const checkoutSetting of [
      "fetch-depth: 1",
      "sparse-checkout-cone-mode: false",
      "sparse-checkout: scripts/production-smoke*.mjs",
    ]) {
      assert.ok(checkoutStep.includes(checkoutSetting));
    }
    assert.match(
      smokeJob,
      /GROUND_CODES_SMOKE_PROFILE:[\s\S]*github\.event_name == 'workflow_dispatch' && github\.event\.inputs\.profile[\s\S]*github\.event_name == 'schedule' && github\.event\.schedule == '\*\/30 \* \* \* \*' && 'quick'[\s\S]*\|\| 'full'/,
    );
    assert.match(
      concurrency,
      /github\.event_name == 'schedule'[\s\S]*production-smoke-scheduled[\s\S]*format\('production-smoke-\{0\}-\{1\}', github\.event_name, github\.run_id\)[\s\S]*cancel-in-progress: \$\{\{ github\.event_name == 'schedule' \}\}/,
    );
  });

  test("runs after web deployment and writes a step summary", () => {
    const smokeScript = readText("./production-smoke.mjs");

    assert.match(smokeWorkflow, /workflow_run:/);
    assert.match(smokeWorkflow, /force_failure:/);
    assert.match(smokeWorkflow, /GROUND_CODES_SMOKE_FORCE_FAILURE/);
    assert.match(smokeWorkflow, /Deploy Web to Cloudflare Pages/);
    assert.match(smokeWorkflow, /issues: write/);
    assert.match(smokeWorkflow, /actions\/github-script@/);
    assert.match(smokeWorkflow, /MOSHI_WEBHOOK_TOKEN is not configured/);
    assert.match(
      smokeWorkflow,
      /github\.event\.workflow_run\.conclusion == 'success'/,
    );
    assert.match(smokeScript, /GITHUB_STEP_SUMMARY/);
    assert.match(smokeScript, /GROUND_CODES_SMOKE_FORCE_FAILURE/);
  });

  test("preserves the smoke outcome across independent notifications", () => {
    const smokeStep = workflowStep(smokeWorkflow, "Run production smoke");
    const moshiStep = workflowStep(smokeWorkflow, "Notify smoke failure");
    const issueStep = workflowStep(smokeWorkflow, "Open smoke failure issue");
    const finalStep = workflowStep(smokeWorkflow, "Fail failed smoke run");

    assert.match(smokeStep, /^\s+id: smoke\s*$/m);
    assert.match(smokeStep, /^\s+continue-on-error: true\s*$/m);

    assert.match(moshiStep, /steps\.smoke\.outcome == 'failure'/);
    assert.match(moshiStep, /^\s+id: moshi\s*$/m);
    assert.match(moshiStep, /^\s+continue-on-error: true\s*$/m);
    assert.match(moshiStep, /^\s+timeout-minutes: 1\s*$/m);
    assert.match(moshiStep, /node scripts\/production-smoke-notify\.mjs/);

    assert.match(issueStep, /steps\.smoke\.outcome == 'failure'/);
    assert.match(issueStep, /env\.MOSHI_WEBHOOK_TOKEN == ''/);
    assert.match(issueStep, /steps\.moshi\.outcome == 'failure'/);
    assert.match(issueStep, /\|\|/);
    assert.match(issueStep, /^\s+continue-on-error: true\s*$/m);

    assert.match(finalStep, /always\(\)/);
    assert.match(finalStep, /steps\.smoke\.outcome == 'failure'/);
    assert.match(finalStep, /^\s+run: exit 1\s*$/m);

    const orderedSteps = [smokeStep, moshiStep, issueStep, finalStep].map(
      (step) => smokeWorkflow.indexOf(step),
    );
    orderedSteps.forEach((index, position) => {
      assert.notEqual(index, -1);
      if (position > 0) assert.ok(orderedSteps[position - 1] < index);
    });
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
    const smokeStep = workflowStep(deployApiWorkflow, "Run production smoke");
    assert.match(
      smokeStep,
      /GROUND_CODES_EXPECTED_RUNTIME_COMMIT: \$\{\{ github\.sha \}\}/,
    );
    assert.match(smokeStep, /pnpm production:smoke/);
  });
});

describe("verified R2 region-data workflow materialization", () => {
  const syncCommand = (groups) =>
    `node scripts/sync-region-data.mjs --groups ${groups} --prune`;

  const assertPublicSyncStep = (workflow, groups) => {
    const syncStep = workflowStep(workflow, "Materialize verified region data");
    assert.match(
      syncStep,
      /REGION_DATA_BASE_URL: \$\{\{ vars\.REGION_DATA_BASE_URL \}\}/,
    );
    assert.match(
      syncStep,
      new RegExp(`run: ${syncCommand(groups).replaceAll(".", "\\.")}`),
    );
    assert.doesNotMatch(
      workflow,
      /R2_REGION_DATA_(?:ACCESS_KEY_ID|SECRET_ACCESS_KEY)/,
    );
    return syncStep;
  };

  test("syncs both groups before every CI data consumer", () => {
    const workflow = readText("../.github/workflows/ci.yml");
    const syncStep = assertPublicSyncStep(workflow, "region-dist,region-db");
    const syncIndex = workflow.indexOf(syncStep);
    assert.match(
      readJson("../package.json").scripts["scripts:test"],
      /apps\/api-ground-codes\/scripts\/\*\.test\.mjs/,
    );

    for (const command of [
      "pnpm scripts:test",
      "pnpm data:audit-labels",
      "pnpm data:report-labels",
      "pnpm --filter ground-codes test",
      "pnpm --filter api-ground-codes test",
      "pnpm coverage",
      "pnpm build",
    ]) {
      assert.ok(
        syncIndex < workflow.indexOf(command),
        `verified sync must run before ${command}`,
      );
    }
  });

  test("syncs both groups before visual QA browser work", () => {
    const workflow = readText("../.github/workflows/visual-qa.yml");
    const syncStep = assertPublicSyncStep(workflow, "region-dist,region-db");
    const syncIndex = workflow.indexOf(syncStep);

    for (const command of [
      "pnpm --filter web test:e2e:layout",
      "pnpm --filter web qa:visual",
    ]) {
      assert.ok(
        syncIndex < workflow.indexOf(command),
        `verified sync must run before ${command}`,
      );
    }
  });

  test("syncs region-dist before API verification, import detection, and build", () => {
    const workflow = readText("../.github/workflows/deploy-api.yml");
    const syncStep = assertPublicSyncStep(workflow, "region-dist");
    const detectorStep = workflowStep(
      workflow,
      "Detect changed region datasets",
    );
    const syncIndex = workflow.indexOf(syncStep);

    assert.match(workflow, /packages\/geoint\/region-data-release\.json/);
    assert.match(
      detectorStep,
      /REGION_DATA_BASE_URL: \$\{\{ vars\.REGION_DATA_BASE_URL \}\}/,
    );
    assert.match(detectorStep, /datasets=__all_missing__/);
    for (const marker of [
      "pnpm --filter api-ground-codes test",
      "pnpm --filter ground-codes build",
      "data:apply-postgis-schema",
      "list-changed-region-datasets.mjs",
      "Import changed region datasets",
    ]) {
      assert.ok(
        syncIndex < workflow.indexOf(marker),
        `verified sync must run before ${marker}`,
      );
    }
  });
});

describe("production deployment serialization", () => {
  for (const [path, group, cancelInProgress] of [
    ["../.github/workflows/deploy-web.yml", "deploy-web-production", true],
    [
      "../.github/workflows/deploy-grok-spiral.yml",
      "deploy-grok-spiral-production",
      true,
    ],
    ["../.github/workflows/deploy-api.yml", "deploy-api-production", false],
  ]) {
    test(`${path} binds production concurrency to its deploy job`, () => {
      const workflow = readText(path);
      const environmentValues = [
        ...deploymentJob(workflow).matchAll(
          /^    environment:\s*([^\s#]+)\s*$/gm,
        ),
      ].map((match) => match[1]);

      assert.equal(
        workflowConcurrency(workflow),
        `concurrency:\n  group: ${group}\n  cancel-in-progress: ${cancelInProgress}`,
      );
      assert.deepEqual(environmentValues, ["production"]);
    });
  }
});
