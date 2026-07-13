import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import {
  analyzeProductionAudit,
  evaluateProductionAudit,
} from "./production-audit-policy.mjs";

const repositoryRoot = new URL("../", import.meta.url);

const readJson = (relativePath) =>
  JSON.parse(readFileSync(new URL(relativePath, repositoryRoot), "utf8"));

const auditDocument = ({
  critical,
  high,
  moderate,
  low,
  advisories = {},
  vulnerabilities = {},
}) => ({
  advisories,
  metadata: {
    vulnerabilities: { critical, high, moderate, low },
  },
  vulnerabilities,
});

const fixtures = [
  {
    name: "accepts a single JSON document without high or critical findings",
    raw: JSON.stringify(
      auditDocument({ critical: 0, high: 0, moderate: 14, low: 3 }),
    ),
    expected: {
      ok: true,
      counts: { critical: 0, high: 0, moderate: 14, low: 3 },
    },
  },
  {
    name: "rejects a high finding after newline-delimited diagnostics",
    raw: [
      "WARN audit endpoint returned { retry: true }",
      JSON.stringify({ level: "warn", context: { attempt: 2 } }),
      JSON.stringify(
        auditDocument({ critical: 0, high: 4, moderate: 2, low: 1 }),
        null,
        2,
      ),
    ].join("\n"),
    expected: {
      ok: false,
      counts: { critical: 0, high: 4, moderate: 2, low: 1 },
    },
  },
  {
    name: "rejects a critical finding",
    raw: JSON.stringify(
      auditDocument({ critical: 1, high: 0, moderate: 0, low: 0 }),
    ),
    expected: {
      ok: false,
      counts: { critical: 1, high: 0, moderate: 0, low: 0 },
    },
  },
];

describe("production audit policy", () => {
  test("locks audited Web runtime fixes, including high-severity transitives", () => {
    const rootPackage = readJson("package.json");
    const webPackage = readJson("apps/web/package.json");
    const lockfile = readFileSync(
      new URL("pnpm-lock.yaml", repositoryRoot),
      "utf8",
    );
    const expectedOverrides = {
      "dompurify@3.4.2": "3.4.12",
      "picomatch@2.3.1": "2.3.2",
      "postcss@8.4.31": "8.4.49",
      "postcss@8.5.3": "8.5.19",
      "protobufjs@8.2.0": "8.7.1",
    };

    for (const vulnerableResolution of Object.keys(expectedOverrides)) {
      const packageName = vulnerableResolution.slice(
        0,
        vulnerableResolution.lastIndexOf("@"),
      );

      assert.equal(
        webPackage.dependencies[packageName],
        undefined,
        `${packageName} must be covered as a transitive Web dependency`,
      );
      assert.equal(
        lockfile.includes(`\n  ${vulnerableResolution}:\n`),
        false,
        `${vulnerableResolution} must not remain in the production lock graph`,
      );
    }

    assert.deepEqual(
      {
        cesium: webPackage.dependencies.cesium,
        "next-intl": webPackage.dependencies["next-intl"],
      },
      { cesium: "1.143.0", "next-intl": "4.13.2" },
    );
    assert.deepEqual(rootPackage.pnpm?.overrides, expectedOverrides);
  });

  for (const fixture of fixtures) {
    test(fixture.name, () => {
      assert.deepEqual(evaluateProductionAudit(fixture.raw), fixture.expected);
    });
  }

  test("analyzes unique package names from advisories and vulnerabilities", () => {
    const raw = JSON.stringify(
      auditDocument({
        critical: 0,
        high: 0,
        moderate: 1,
        low: 1,
        advisories: {
          1001: { module_name: "duplicate-package" },
          1002: { module_name: "advisory-package" },
        },
        vulnerabilities: {
          duplicate: { name: "duplicate-package" },
          vulnerability: { name: "vulnerability-package" },
        },
      }),
    );

    assert.deepEqual(analyzeProductionAudit(raw), {
      ok: true,
      counts: { critical: 0, high: 0, moderate: 1, low: 1 },
      packageNames: [
        "advisory-package",
        "duplicate-package",
        "vulnerability-package",
      ],
    });
  });

  for (const fixture of [
    {
      name: "rejects an unreadable audit result",
      raw: "audit failed without JSON",
    },
    {
      name: "rejects a malformed severity count",
      raw: JSON.stringify(
        auditDocument({ critical: 0, high: "4", moderate: 0, low: 0 }),
      ),
    },
    {
      name: "rejects a missing severity count",
      raw: JSON.stringify({
        metadata: {
          vulnerabilities: { critical: 0, high: 0, moderate: 0 },
        },
      }),
    },
    {
      name: "rejects a negative severity count",
      raw: JSON.stringify(
        auditDocument({ critical: 0, high: 0, moderate: 0, low: -1 }),
      ),
    },
  ]) {
    test(fixture.name, () => {
      assert.throws(
        () => evaluateProductionAudit(fixture.raw),
        /readable pnpm audit JSON document/,
      );
    });
  }
});
