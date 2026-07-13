import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  evaluateProductionAudit,
  getProductionAuditPackageNames,
} from "./production-audit-policy.mjs";

const auditDocument = ({ critical, high, moderate, low }) => ({
  advisories: {
    1001: { module_name: "example-high-package" },
    1002: { module_name: "example-low-package" },
  },
  metadata: {
    vulnerabilities: { critical, high, moderate, low },
  },
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
      "WARN audit endpoint returned a diagnostic",
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

  test("reports unique advisory package names without advisory details", () => {
    const raw = JSON.stringify(
      auditDocument({ critical: 0, high: 0, moderate: 1, low: 1 }),
    );

    assert.deepEqual(getProductionAuditPackageNames(raw), [
      "example-high-package",
      "example-low-package",
    ]);
  });

  test("rejects an unreadable audit result", () => {
    assert.throws(
      () => evaluateProductionAudit("audit failed without JSON"),
      /readable pnpm audit JSON document/,
    );
  });
});
