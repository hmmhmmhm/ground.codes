import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  indentedYamlBlock,
  readJson,
  readText,
  workflowUrls,
} from "./workflow-test-helpers.mjs";

const apps = [
  {
    name: "web",
    expectedBuild:
      "pnpm exec next-on-pages && node scripts/patch-pages-routes.mjs",
  },
  { name: "grok-spiral", expectedBuild: "pnpm exec next-on-pages" },
];

describe("Pages release toolchain", () => {
  test("keeps the local Node version aligned with CI Node 22", () => {
    assert.equal(readText("../.nvmrc"), "22\n");

    const configuredVersions = workflowUrls
      .flatMap((url) => [
        ...readText(url).matchAll(/^\s+node-version:\s*["']?([^\s"']+)/gm),
      ])
      .map((match) => match[1]);

    assert.ok(configuredVersions.length > 0, "CI must configure Node");
    assert.deepEqual(
      [...new Set(configuredVersions)],
      ["22"],
      "every CI Node setup must match .nvmrc",
    );
  });

  for (const { name, expectedBuild } of apps) {
    test(`${name} resolves Pages and Vercel tools from its local install`, () => {
      const packageJson = readJson(`../apps/${name}/package.json`);

      assert.equal(packageJson.scripts["pages:build"], expectedBuild);
      assert.doesNotMatch(
        packageJson.scripts["pages:build"],
        /\b(?:npx|dlx)\b/,
      );
      assert.equal(packageJson.devDependencies.vercel, "47.0.4");
    });
  }

  test("locks the exact Vercel release tool in both app importers", () => {
    const lockfile = readText("../pnpm-lock.yaml");

    for (const { name } of apps) {
      const importer = indentedYamlBlock(lockfile, `apps/${name}`);
      const devDependencies = indentedYamlBlock(importer, "devDependencies");

      const lockedVercel = indentedYamlBlock(devDependencies, "vercel");
      const specifier = /^\s+specifier:\s+(\S+)\s*$/m.exec(lockedVercel)?.[1];
      const version = /^\s+version:\s+(\S+)\s*$/m.exec(lockedVercel)?.[1];

      assert.equal(specifier, "47.0.4");
      assert.equal(version?.split("(", 1)[0], "47.0.4");
    }
  });
});
