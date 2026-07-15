import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const configs = [
  "../apps/web/playwright.config.ts",
  "../apps/web/playwright.production.config.ts",
];

describe("Playwright CI git metadata policy", () => {
  for (const path of configs) {
    test(`${path} keeps commit metadata without collecting repository diffs`, () => {
      const source = readFileSync(new URL(path, import.meta.url), "utf8");

      assert.match(
        source,
        /captureGitInfo:\s*\{\s*commit:\s*true,\s*diff:\s*false\s*\}/,
      );
    });
  }
});
