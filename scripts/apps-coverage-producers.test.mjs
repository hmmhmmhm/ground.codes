import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readPackage = (relativePath) =>
  JSON.parse(
    readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8"),
  );

test("API and Web coverage producers emit root-relative Bun LCOV reports", () => {
  const rootScripts = readPackage("package.json").scripts;
  const apiScripts = readPackage("apps/api-ground-codes/package.json").scripts;
  const webScripts = readPackage("apps/web/package.json").scripts;

  assert.equal(
    rootScripts["coverage:api"],
    "pnpm --filter api-ground-codes test:coverage",
  );
  assert.equal(rootScripts["coverage:web"], "pnpm --filter web test:coverage");
  assert.equal(
    apiScripts["test:coverage"],
    "cd ../.. && bun test --coverage --coverage-reporter=lcov --coverage-reporter=text --coverage-dir=coverage/api apps/api-ground-codes/src/*.test.ts",
  );
  assert.equal(
    webScripts["test:coverage"],
    "cd ../.. && bun test --coverage --coverage-reporter=lcov --coverage-reporter=text --coverage-dir=coverage/web ./apps/web/lib ./apps/web/app ./apps/web/components ./apps/web/hooks",
  );
});
