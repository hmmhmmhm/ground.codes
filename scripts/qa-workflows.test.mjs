import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, test } from "node:test";

const readText = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const readJson = (path) => JSON.parse(readText(path));
const workflowDirectory = new URL("../.github/workflows/", import.meta.url);
const workflowUrls = readdirSync(workflowDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
  .map((entry) => new URL(entry.name, workflowDirectory))
  .sort((left, right) => left.pathname.localeCompare(right.pathname));

const approvedActionPins = new Map([
  ["actions/checkout", "df4cb1c069e1874edd31b4311f1884172cec0e10 # v6"],
  ["actions/setup-node", "48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6"],
  ["actions/cache", "caa296126883cff596d87d8935842f9db880ef25 # v5"],
  ["actions/upload-artifact", "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7"],
  ["actions/github-script", "ed597411d8f924073f98dfc5c65a23a2325f34cd # v8"],
  ["pnpm/action-setup", "0ebf47130e4866e96fce0953f49152a61190b271 # v6"],
  ["oven-sh/setup-bun", "0c5077e51419868618aeaa5fe8019c62421857d6 # v2"],
]);

const externalActionPattern =
  /^uses:\s+([^@\s#]+)@([0-9a-f]{40})\s+#\s+(v[^\s#]+)\s*$/i;

const dependabotSection = (source, ecosystem) => {
  const sections = [
    ...source.matchAll(
      /^\s*-\s+package-ecosystem:\s*["']?([^"'\s]+)["']?\s*$/gm,
    ),
  ];
  const sectionIndex = sections.findIndex((match) => match[1] === ecosystem);

  assert.notEqual(sectionIndex, -1, `${ecosystem} update entry is required`);

  const start = sections[sectionIndex].index;
  const end = sections[sectionIndex + 1]?.index ?? source.length;
  return source.slice(start, end);
};

const indentedYamlBlock = (source, key) => {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headerPattern = new RegExp(`^( *)${escapedKey}:\\s*$`);
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const headers = lines.flatMap((line, index) => {
    const match = headerPattern.exec(line);
    return match ? [{ index, indent: match[1].length }] : [];
  });

  assert.equal(headers.length, 1, `${key} must appear exactly once`);

  const [{ index: start, indent }] = headers;
  let end = start + 1;

  while (end < lines.length) {
    const line = lines[end];
    if (line.trim() !== "" && line.match(/^ */)[0].length <= indent) break;
    end += 1;
  }

  return lines.slice(start, end).join("\n").trimEnd();
};

const workflowStep = (source, name) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const start = lines.findIndex((line) =>
    new RegExp(`^\\s*- name: ${escapedName}\\s*$`).test(line),
  );

  assert.notEqual(start, -1, `${name} step is required`);

  const indent = lines[start].match(/^ */)[0].length;
  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (line.trim() !== "" && /^\s*- name:/.test(line)) {
      const lineIndent = line.match(/^ */)[0].length;
      if (lineIndent === indent) break;
    }
    end += 1;
  }

  return lines.slice(start, end).join("\n").trimEnd();
};

const expectedDependabotGroups = new Map([
  [
    "runtime-security",
    [
      "      runtime-security:",
      "        patterns:",
      '          - "*"',
      '        dependency-type: "production"',
      "        update-types:",
      '          - "minor"',
      '          - "patch"',
    ].join("\n"),
  ],
  [
    "development-tooling",
    [
      "      development-tooling:",
      "        patterns:",
      '          - "*"',
      '        dependency-type: "development"',
      "        update-types:",
      '          - "minor"',
      '          - "patch"',
    ].join("\n"),
  ],
  [
    "github-actions",
    ["      github-actions:", "        patterns:", '          - "*"'].join(
      "\n",
    ),
  ],
]);

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

describe("GitHub automation supply-chain policy", () => {
  test("pins every external action to an approved SHA with a release comment", () => {
    for (const workflowUrl of workflowUrls) {
      const usesLines = readFileSync(workflowUrl, "utf8")
        .split("\n")
        .map((line) => line.trim().replace(/^-\s+/, ""))
        .filter((line) => line.startsWith("uses:"));

      for (const line of usesLines) {
        if (/^uses:\s+\.\//.test(line)) continue;

        const match = externalActionPattern.exec(line);
        assert.ok(
          match,
          `${workflowUrl.pathname} has an unpinned action: ${line}`,
        );

        const [, action, sha, release] = match;
        assert.equal(
          `${sha} # ${release}`,
          approvedActionPins.get(action),
          `${workflowUrl.pathname} has an unapproved pin for ${action}`,
        );
      }
    }
  });

  test("pins every setup-bun toolchain input", () => {
    for (const workflowUrl of workflowUrls) {
      const workflow = readFileSync(workflowUrl, "utf8");
      const setupCount = [...workflow.matchAll(/uses: oven-sh\/setup-bun@/g)]
        .length;
      const versionMatches = [
        ...workflow.matchAll(/^\s*bun-version:\s*["']?([^"'\s]+)["']?\s*$/gm),
      ];

      assert.equal(versionMatches.length, setupCount);
      versionMatches.forEach((match) => assert.equal(match[1], "1.3.1"));
    }
  });

  test("rejects Dependabot groups nested under a sibling policy key", () => {
    const source = [
      "groups:",
      "  enabled:",
      "    patterns:",
      '      - "*"',
      "disabled-groups:",
      "  runtime-security:",
      "    patterns:",
      '      - "*"',
      '    dependency-type: "production"',
      "    update-types:",
      '      - "minor"',
      '      - "patch"',
    ].join("\n");
    const groups = indentedYamlBlock(source, "groups");

    assert.throws(
      () => indentedYamlBlock(groups, "runtime-security"),
      /runtime-security must appear exactly once/,
    );
  });

  test("configures grouped weekly Dependabot updates", () => {
    const dependabotUrl = new URL("../.github/dependabot.yml", import.meta.url);

    assert.ok(existsSync(dependabotUrl), ".github/dependabot.yml is required");

    const dependabot = readFileSync(dependabotUrl, "utf8");
    assert.match(dependabot, /^version:\s*2\s*$/m);

    const npmUpdates = dependabotSection(dependabot, "npm");
    const actionUpdates = dependabotSection(dependabot, "github-actions");

    for (const section of [npmUpdates, actionUpdates]) {
      assert.match(section, /^\s+directory:\s*["']\/["']\s*$/m);
      assert.match(section, /^\s+interval:\s*["']?weekly["']?\s*$/m);
      assert.match(section, /^\s+day:\s*["']?monday["']?\s*$/m);
      assert.match(section, /^\s+timezone:\s*["']?Asia\/Seoul["']?\s*$/m);
      assert.match(section, /^\s+open-pull-requests-limit:\s*10\s*$/m);
    }

    const npmGroups = indentedYamlBlock(npmUpdates, "groups");
    const actionGroups = indentedYamlBlock(actionUpdates, "groups");

    assert.equal(
      indentedYamlBlock(npmGroups, "runtime-security"),
      expectedDependabotGroups.get("runtime-security"),
    );
    assert.equal(
      indentedYamlBlock(npmGroups, "development-tooling"),
      expectedDependabotGroups.get("development-tooling"),
    );
    assert.equal(
      indentedYamlBlock(actionGroups, "github-actions"),
      expectedDependabotGroups.get("github-actions"),
    );
  });
});

describe("CI security gate order", () => {
  test("runs audit and governance checks before expensive verification", () => {
    const ciWorkflow = readText("../.github/workflows/ci.yml");
    const verifyJob = indentedYamlBlock(ciWorkflow, "verify");
    const rootScripts = readJson("../package.json").scripts;

    assert.equal(rootScripts["scripts:test"], "node --test scripts/*.test.mjs");
    for (const testPath of [
      "./api-runtime-pins.test.mjs",
      "./check-production-audit.test.mjs",
      "./github-governance.test.mjs",
      "./production-audit-policy.test.mjs",
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

describe("production smoke workflow triggers", () => {
  test("runs after web deployment and writes a step summary", () => {
    const smokeWorkflow = readText("../.github/workflows/production-smoke.yml");
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
    const smokeWorkflow = readText("../.github/workflows/production-smoke.yml");
    const smokeStep = workflowStep(smokeWorkflow, "Run production smoke");
    const moshiStep = workflowStep(smokeWorkflow, "Notify smoke failure");
    const issueStep = workflowStep(smokeWorkflow, "Open smoke failure issue");
    const finalStep = workflowStep(smokeWorkflow, "Fail failed smoke run");

    assert.match(smokeStep, /^\s+id: smoke\s*$/m);
    assert.match(smokeStep, /^\s+continue-on-error: true\s*$/m);

    assert.match(moshiStep, /steps\.smoke\.outcome == 'failure'/);
    assert.match(moshiStep, /^\s+id: moshi\s*$/m);
    assert.match(moshiStep, /^\s+continue-on-error: true\s*$/m);
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
    assert.match(deployApiWorkflow, /pnpm production:smoke/);
  });
});
