import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  analyzeProductionAudit,
  evaluateProductionAudit,
} from "./production-audit-policy.mjs";

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
