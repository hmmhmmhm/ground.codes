import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readPackage = (relativePath) =>
  JSON.parse(
    readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8"),
  );

test("API and Web coverage producers augment Bun LCOV with c8 branches", () => {
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
    [
      "cd ../..",
      "bun test --coverage --coverage-reporter=lcov --coverage-reporter=text --coverage-dir=coverage/api apps/api-ground-codes/src/*.test.ts",
      "pnpm exec c8 --all --exclude-after-remap --include 'apps/api-ground-codes/src/**/*.ts' --exclude 'apps/api-ground-codes/src/**/*.test.ts' --exclude 'apps/api-ground-codes/src/**/*.d.ts' --exclude '**/<define:import.meta>' --reporter=lcov --reporter=text --reports-dir coverage/api-branches pnpm --filter ground-codes exec tsx --test ../../scripts/coverage-branch-probes/api.test.ts",
      "node scripts/merge-branch-coverage.mjs api",
    ].join(" && "),
  );
  assert.equal(
    webScripts["test:coverage"],
    [
      "cd ../..",
      "bun test --coverage --coverage-reporter=lcov --coverage-reporter=text --coverage-dir=coverage/web ./apps/web/lib ./apps/web/app ./apps/web/components ./apps/web/hooks",
      "pnpm exec c8 --all --exclude-after-remap --include apps/web/lib/code/ground-codes.ts --include apps/web/lib/code/share-url.ts --include apps/web/lib/i18n/ground-code-language.ts --include apps/web/lib/map/celestial-bodies.ts --include apps/web/lib/map/google-maps-availability.ts --include apps/web/hooks/use-disable-zoom.ts --exclude '**/<define:import.meta>' --reporter=lcov --reporter=text --reports-dir coverage/web-branches pnpm --filter ground-codes exec tsx --test ../../scripts/coverage-branch-probes/web.test.ts",
      "node scripts/merge-branch-coverage.mjs web",
    ].join(" && "),
  );
});
