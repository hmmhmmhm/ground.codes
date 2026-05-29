import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  RUNTIME_PACKAGES,
  buildPinnedDependency,
  getRuntimePinFailures,
  getStrictRuntimePinFailures,
  updateRuntimePins,
  usesWorkspaceRuntime,
} from "./api-runtime-pins.mjs";

describe("API runtime package pins", () => {
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
    const packageJson = {
      dependencies: {
        "ground-codes": "workspace:*",
        "@ground-codes/geoint": "workspace:*",
        "@repo/codebook": "workspace:*",
      },
    };

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
      },
    };

    const updated = updateRuntimePins(packageJson, "railway-api-runtime-20260519");

    assert.equal(updated, true);
    assert.equal(packageJson.dependencies.elysia, "latest");
    assert.deepEqual(
      getRuntimePinFailures(packageJson, "railway-api-runtime-20260519"),
      [],
    );
  });
});
