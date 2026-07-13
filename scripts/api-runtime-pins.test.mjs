import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import {
  RUNTIME_PACKAGES,
  buildPinnedDependency,
  getRuntimePinFailures,
  getStrictRuntimePinFailures,
  updateRuntimePins,
  usesWorkspaceRuntime,
} from "./api-runtime-pins.mjs";

const EXACT_RUNTIME_PINS = {
  dependencies: {
    elysia: "1.4.29",
    "@elysiajs/cors": "1.4.2",
    "@elysiajs/static": "1.4.10",
    "@elysiajs/swagger": "1.3.1",
  },
  devDependencies: {
    "bun-types": "1.3.1",
  },
};

const readJson = (url) => JSON.parse(readFileSync(url, "utf8"));

const apiPackageJsonUrl = new URL(
  "../apps/api-ground-codes/package.json",
  import.meta.url,
);

const buildPackageJson = () => ({
  dependencies: {
    "ground-codes": "workspace:*",
    "@ground-codes/geoint": "workspace:*",
    "@repo/codebook": "workspace:*",
    ...EXACT_RUNTIME_PINS.dependencies,
  },
  devDependencies: { ...EXACT_RUNTIME_PINS.devDependencies },
});

const compareExactVersions = (left, right) => {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }

  return 0;
};

describe("API runtime package pins", () => {
  test("pins the reviewed Elysia runtime group to exact versions", () => {
    const packageJson = readJson(apiPackageJsonUrl);

    assert.equal(packageJson.dependencies.elysia, "1.4.29");
    assert.equal(packageJson.devDependencies["bun-types"], "1.3.1");
    assert.equal(packageJson.dependencies["@elysiajs/cors"], "1.4.2");
    assert.equal(packageJson.dependencies["@elysiajs/static"], "1.4.10");
    assert.equal(packageJson.dependencies["@elysiajs/swagger"], "1.3.1");
  });

  test("rejects moving and unbounded Elysia and Bun type pins", () => {
    for (const dependencyName of ["elysia", "bun-types"]) {
      for (const invalidPin of [
        "latest",
        "*",
        "^1.4.0",
        ">=1.4.0",
        "github:elysiajs/elysia#main",
      ]) {
        const packageJson = buildPackageJson();
        const dependencyGroup =
          dependencyName === "bun-types"
            ? packageJson.devDependencies
            : packageJson.dependencies;
        dependencyGroup[dependencyName] = invalidPin;

        assert.deepEqual(
          getRuntimePinFailures(packageJson, "railway-api-runtime-20260519"),
          [
            `${dependencyName} expected exact ${
              dependencyName === "bun-types" ? "1.3.1" : "1.4.29"
            }, found ${invalidPin}`,
          ],
        );
      }
    }
  });

  test("uses plugin releases whose declared peers include Elysia 1.4.29", () => {
    const pluginPeers = {
      "@elysiajs/cors": ">= 1.4.0",
      "@elysiajs/static": ">= 1.4.0",
      "@elysiajs/swagger": ">= 1.3.0",
    };

    for (const [pluginName, expectedPeerRange] of Object.entries(pluginPeers)) {
      const pluginPackageJson = readJson(
        new URL(
          `../apps/api-ground-codes/node_modules/${pluginName}/package.json`,
          import.meta.url,
        ),
      );
      const expectedPluginVersion = EXACT_RUNTIME_PINS.dependencies[pluginName];
      const peerRange = pluginPackageJson.peerDependencies?.elysia;
      const minimumPeerVersion = peerRange?.match(
        /^>=\s+(\d+\.\d+\.\d+)$/,
      )?.[1];

      assert.equal(pluginPackageJson.version, expectedPluginVersion);
      assert.equal(peerRange, expectedPeerRange);
      assert.ok(minimumPeerVersion);
      assert.ok(compareExactVersions("1.4.29", minimumPeerVersion) >= 0);
    }
  });

  test("builds git dependency pins for all runtime packages", () => {
    assert.deepEqual(RUNTIME_PACKAGES, [
      {
        name: "ground-codes",
        path: "packages/ground-codes",
      },
      {
        name: "@ground-codes/geoint",
        path: "packages/geoint",
      },
      {
        name: "@repo/codebook",
        path: "packages/codebook",
      },
    ]);

    assert.equal(
      buildPinnedDependency("railway-api-runtime-20260519", {
        path: "packages/ground-codes",
      }),
      "git+https://github.com/hmmhmmhm/ground.codes.git#railway-api-runtime-20260519&path:packages/ground-codes",
    );
  });

  test("reports every runtime dependency that does not match the target tag", () => {
    const packageJson = {
      dependencies: {
        "ground-codes":
          "git+https://github.com/hmmhmmhm/ground.codes.git#old-tag&path:packages/ground-codes",
      },
    };

    assert.deepEqual(
      getStrictRuntimePinFailures(packageJson, "railway-api-runtime-20260519"),
      [
        "ground-codes expected git+https://github.com/hmmhmmhm/ground.codes.git#railway-api-runtime-20260519&path:packages/ground-codes, found git+https://github.com/hmmhmmhm/ground.codes.git#old-tag&path:packages/ground-codes",
        "@ground-codes/geoint expected git+https://github.com/hmmhmmhm/ground.codes.git#railway-api-runtime-20260519&path:packages/geoint, found missing",
        "@repo/codebook expected git+https://github.com/hmmhmmhm/ground.codes.git#railway-api-runtime-20260519&path:packages/codebook, found missing",
      ],
    );
  });

  test("accepts workspace runtime dependencies for monorepo deployments", () => {
    const packageJson = buildPackageJson();

    assert.equal(usesWorkspaceRuntime(packageJson), true);
    assert.deepEqual(
      getRuntimePinFailures(packageJson, "railway-api-runtime-20260519"),
      [],
    );
  });

  test("updates package json dependencies to one runtime tag", () => {
    const packageJson = {
      dependencies: {
        "ground-codes": "workspace:*",
        "@ground-codes/geoint": "workspace:*",
        "@repo/codebook": "workspace:*",
        elysia: "latest",
        "@elysiajs/cors": "^1.2.0",
        "@elysiajs/static": "^1.2.0",
        "@elysiajs/swagger": "^1.2.2",
      },
      devDependencies: {
        "bun-types": "latest",
      },
    };

    const updated = updateRuntimePins(
      packageJson,
      "railway-api-runtime-20260519",
    );

    assert.equal(updated, true);
    assert.deepEqual(packageJson.dependencies, {
      "ground-codes":
        "git+https://github.com/hmmhmmhm/ground.codes.git#railway-api-runtime-20260519&path:packages/ground-codes",
      "@ground-codes/geoint":
        "git+https://github.com/hmmhmmhm/ground.codes.git#railway-api-runtime-20260519&path:packages/geoint",
      "@repo/codebook":
        "git+https://github.com/hmmhmmhm/ground.codes.git#railway-api-runtime-20260519&path:packages/codebook",
      ...EXACT_RUNTIME_PINS.dependencies,
    });
    assert.deepEqual(
      packageJson.devDependencies,
      EXACT_RUNTIME_PINS.devDependencies,
    );
    assert.deepEqual(
      getRuntimePinFailures(packageJson, "railway-api-runtime-20260519"),
      [],
    );
  });
});
