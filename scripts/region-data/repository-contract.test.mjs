import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

const git = (...arguments_) =>
  execFileSync("git", arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim();

describe("region data repository contract", () => {
  test("keeps materialized data out of Git and under ignore rules", () => {
    for (const directory of ["region-dist", "region-db"]) {
      const path = `packages/geoint/${directory}`;
      assert.equal(
        git("ls-files", "--", `${path}/**`),
        "",
        `${path} must not be tracked; materialize it from R2 instead`,
      );

      const ignored = spawnSync(
        "git",
        ["check-ignore", "--quiet", "--", `${path}/.materialized`],
        { cwd: repositoryRoot },
      );
      assert.equal(ignored.status, 0, `${path} must be ignored`);
    }
  });

  test("keeps the release pointer and test fixtures tracked", () => {
    assert.equal(
      git("ls-files", "--", "packages/geoint/region-data-release.json"),
      "packages/geoint/region-data-release.json",
    );

    const fixtures = git("ls-files", "--", "scripts/region-data/fixtures/**")
      .split("\n")
      .filter(Boolean);
    assert.ok(fixtures.length > 0, "region data fixtures must remain tracked");
  });

  test("packages only the pointer and setup documentation with geoint", () => {
    const packageJson = JSON.parse(
      readFileSync(`${repositoryRoot}/packages/geoint/package.json`, "utf8"),
    );
    assert.deepEqual(packageJson.files, [
      "dist",
      "src",
      "README.md",
      "region-data-release.json",
    ]);
  });
});
