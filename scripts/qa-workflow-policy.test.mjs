import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, test } from "node:test";

import {
  assertFrozenInstallPolicy,
  assertPinnedBunPolicy,
  assertPinnedPnpmPolicy,
  indentedYamlBlock,
  readJson,
  readText,
  workflowStepCommand,
  workflowSteps,
  workflowUrls,
} from "./workflow-test-helpers.mjs";

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
const dependencyWorkflowNames = new Set([
  "ci.yml",
  "deploy-api.yml",
  "deploy-web.yml",
  "deploy-grok-spiral.yml",
  "visual-qa.yml",
]);

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

const expectedDependencyGroup = (name, type) => `      ${name}:
        patterns:
          - "*"
        dependency-type: "${type}"
        update-types:
          - "minor"
          - "patch"`;

test("provides reusable workflow policy helpers", async () => {
  const helpers = await import("./workflow-test-helpers.mjs");

  for (const name of [
    "assertFrozenInstallPolicy",
    "assertPinnedBunPolicy",
    "assertPinnedPnpmPolicy",
    "indentedYamlBlock",
    "readJson",
    "readText",
    "workflowStep",
    "workflowStepCommand",
    "workflowSteps",
    "workflowUrls",
  ]) {
    assert.equal(
      typeof helpers[name],
      name === "workflowUrls" ? "object" : "function",
    );
  }
});

describe("workflow policy mutation resistance", () => {
  test("parses commands from inline and multiline run steps", () => {
    const source = `jobs:
  verify:
    steps:
      - name: Install dependencies
        run: |
          pnpm install
      - name: Verify
        run: pnpm test
      - name: Commented block
        run: |- # preserve the command block
          pnpm lint`;
    const steps = workflowSteps(source);

    assert.equal(steps.length, 3);
    assert.equal(steps[0].name, "Install dependencies");
    assert.equal(workflowStepCommand(steps[0]), "pnpm install");
    assert.equal(workflowStepCommand(steps[1]), "pnpm test");
    assert.equal(workflowStepCommand(steps[2]), "pnpm lint");
  });

  test("rejects a multiline non-frozen install mutation", () => {
    const source = `jobs:
  deploy:
    steps:
      - name: Install dependencies
        run: |
          pnpm install`;

    assert.throws(
      () =>
        assertFrozenInstallPolicy({
          path: "deploy-web.yml",
          source,
          requireInstall: true,
        }),
      /pnpm install --frozen-lockfile/,
    );
  });

  test("rejects an unrelated Bun version beside an unpinned setup step", () => {
    const source = `jobs:
  verify:
    steps:
      - name: Setup Bun
        uses: oven-sh/setup-bun@0000000000000000000000000000000000000000
      - name: Unrelated configuration
        uses: example/action@0000000000000000000000000000000000000000
        with:
          bun-version: "1.3.1"`;

    assert.throws(
      () => assertPinnedBunPolicy({ path: "ci.yml", source }),
      /Setup Bun.*with.*bun-version/s,
    );
  });

  test("rejects bun-version nested under env.with", () => {
    const source = `jobs:
  verify:
    steps:
      - name: Setup Bun
        uses: oven-sh/setup-bun@0000000000000000000000000000000000000000
        env:
          with:
            bun-version: "1.3.1"`;

    assert.throws(
      () => assertPinnedBunPolicy({ path: "ci.yml", source }),
      /Setup Bun.*direct with.*bun-version/s,
    );
  });

  test("rejects bun-version nested under with.cache", () => {
    const source = `jobs:
  verify:
    steps:
      - name: Setup Bun
        uses: oven-sh/setup-bun@0000000000000000000000000000000000000000
        with:
          cache:
            bun-version: "1.3.1"`;

    assert.throws(
      () => assertPinnedBunPolicy({ path: "ci.yml", source }),
      /Setup Bun.*direct with.*bun-version/s,
    );
  });

  test("rejects a wrong or indirectly configured pnpm version", () => {
    const wrongVersion = `jobs:
  verify:
    steps:
      - name: Setup pnpm
        uses: pnpm/action-setup@0000000000000000000000000000000000000000
        with:
          version: 9.0.0`;
    const nestedVersion = `jobs:
  verify:
    steps:
      - name: Setup pnpm
        uses: pnpm/action-setup@0000000000000000000000000000000000000000
        with:
          configuration:
            version: 11.4.0`;

    assert.throws(
      () =>
        assertPinnedPnpmPolicy({
          path: "ci.yml",
          source: wrongVersion,
          version: "11.4.0",
        }),
      /Setup pnpm.*direct with.*version: "11\.4\.0"/s,
    );
    assert.throws(
      () =>
        assertPinnedPnpmPolicy({
          path: "ci.yml",
          source: nestedVersion,
          version: "11.4.0",
        }),
      /Setup pnpm.*direct with.*version: "11\.4\.0"/s,
    );
  });

  test("rejects removing installs from every required workflow", () => {
    const requiredWorkflows = workflowUrls.filter((workflowUrl) =>
      dependencyWorkflowNames.has(workflowUrl.pathname.split("/").at(-1)),
    );
    assert.equal(requiredWorkflows.length, dependencyWorkflowNames.size);

    for (const workflowUrl of requiredWorkflows) {
      const source = readText(workflowUrl);
      const installStep = workflowSteps(source).find(
        (step) => step.name === "Install dependencies",
      );
      assert.ok(
        installStep,
        `${workflowUrl.pathname} install fixture is required`,
      );
      const mutated = source.replace(installStep.block, "");

      assert.throws(
        () =>
          assertFrozenInstallPolicy({
            path: workflowUrl.pathname,
            source: mutated,
            requireInstall: true,
          }),
        /exactly one Install dependencies step/,
      );
    }
  });
});

describe("GitHub automation supply-chain policy", () => {
  test("pins every external action to an approved SHA with a release comment", () => {
    for (const workflowUrl of workflowUrls) {
      const usesLines = readText(workflowUrl)
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

  test("couples each setup-bun step to its exact version input", () => {
    for (const workflowUrl of workflowUrls) {
      assertPinnedBunPolicy({
        path: workflowUrl.pathname,
        source: readText(workflowUrl),
      });
    }
  });

  test("couples each setup-pnpm step to the exact package manager version", () => {
    const { packageManager } = readJson("../package.json");
    assert.equal(packageManager, "pnpm@11.4.0");
    const version = packageManager.slice("pnpm@".length);

    for (const workflowUrl of workflowUrls) {
      assertPinnedPnpmPolicy({
        path: workflowUrl.pathname,
        source: readText(workflowUrl),
        version,
      });
    }
  });

  test("pins pnpm across package, container, and operator entry points", () => {
    const rootPackage = readJson("../package.json");
    assert.equal(rootPackage.pnpm, undefined);
    assert.equal(
      indentedYamlBlock(readText("../pnpm-workspace.yaml"), "overrides"),
      `overrides:
  "@swc/helpers@0.5.15": "0.5.17"
  "dompurify@3.4.2": "3.4.12"
  "picomatch@2.3.1": "2.3.2"
  "postcss@8.4.31": "8.4.49"
  "postcss@8.5.3": "8.5.19"
  "protobufjs@8.2.0": "8.7.1"`,
    );
    const releaseAgeExclusions = indentedYamlBlock(
      readText("../pnpm-workspace.yaml"),
      "minimumReleaseAgeExclude",
    )
      .split("\n")
      .slice(1)
      .map((line) => /^\s+-\s+"([^"]+)"$/.exec(line)?.[1]);
    assert.equal(releaseAgeExclusions.length, 21);
    for (const selector of releaseAgeExclusions) {
      assert.match(
        selector,
        /^@(aws-sdk|smithy)\/[a-z0-9-]+@\d+\.\d+\.\d+$/,
        "minimumReleaseAge exclusions must select exact AWS dependency versions",
      );
    }
    assert.equal(
      indentedYamlBlock(readText("../pnpm-workspace.yaml"), "allowBuilds"),
      `allowBuilds:
  "@parcel/watcher@2.5.1": true
  "@swc/core@1.15.43": true
  "classic-level@2.0.0": true
  "esbuild@0.14.47 || 0.15.18 || 0.25.12 || 0.27.7 || 0.28.0 || 0.28.1": true
  "sharp@0.34.5": true
  "workerd@1.20250718.0 || 1.20260708.1": true`,
    );
    assert.equal(
      readJson("../apps/api-ground-codes/package.json").packageManager,
      "pnpm@11.4.0",
    );

    for (const path of [
      "../Dockerfile",
      "../apps/api-ground-codes/Dockerfile",
    ]) {
      const source = readText(path);
      assert.match(source, /corepack prepare pnpm@11\.4\.0 --activate/);
      assert.doesNotMatch(source, /corepack prepare pnpm@(?!11\.4\.0\b)/);
    }

    const runbook = readText("../docs/operations/incident-runbook.md");
    assert.match(runbook, /release tools are pnpm 11\.4\.0,/);
    assert.match(runbook, /test "\$\(pnpm --version\)" = "11\.4\.0"/);
  });

  test("requires exact frozen install steps and rejects all other installs", () => {
    for (const workflowUrl of workflowUrls) {
      assertFrozenInstallPolicy({
        path: workflowUrl.pathname,
        source: readText(workflowUrl),
        requireInstall: dependencyWorkflowNames.has(
          workflowUrl.pathname.split("/").at(-1),
        ),
      });
    }
  });

  test("uses exact local deployment tool dependencies and commands", () => {
    const rootDevDependencies = readJson("../package.json").devDependencies;
    const webScripts = readJson("../apps/web/package.json").scripts;
    const grokScripts = readJson("../apps/grok-spiral/package.json").scripts;
    const apiWorkflow = readText("../.github/workflows/deploy-api.yml");
    const webWorkflow = readText("../.github/workflows/deploy-web.yml");
    const grokWorkflow = readText(
      "../.github/workflows/deploy-grok-spiral.yml",
    );
    assert.equal(rootDevDependencies.wrangler, "4.110.0");
    assert.equal(rootDevDependencies.c8, "11.0.0");
    assert.match(webScripts.deploy, /pnpm exec wrangler pages deploy/);
    assert.match(grokScripts.deploy, /pnpm exec wrangler pages deploy/);
    assert.match(apiWorkflow, /pnpm exec wrangler deploy/);
    assert.match(webWorkflow, /pnpm --filter web deploy/);
    assert.match(grokWorkflow, /pnpm --filter grok-spiral deploy/);
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
    const dependabot = readText(dependabotUrl);
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
      expectedDependencyGroup("runtime-security", "production"),
    );
    assert.equal(
      indentedYamlBlock(npmGroups, "development-tooling"),
      expectedDependencyGroup("development-tooling", "development"),
    );
    assert.equal(
      indentedYamlBlock(actionGroups, "github-actions"),
      '      github-actions:\n        patterns:\n          - "*"',
    );
  });
});
