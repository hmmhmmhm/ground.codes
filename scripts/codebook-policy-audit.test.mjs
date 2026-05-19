import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { auditCodebooks, EXPECTED_COUNTS } from "./codebook-policy-audit.mjs";

describe("codebook policy audit", () => {
  test("keeps distributed codebooks at the guide-approved counts", () => {
    const { summary } = auditCodebooks();

    for (const [language, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
      assert.equal(summary[language].count, expectedCount);
      assert.equal(summary[language].unique, expectedCount);
      assert.equal(summary[language].blanks, 0);
    }
  });

  test("keeps guide-reviewed policy violations out of distributed codebooks", () => {
    const { violations } = auditCodebooks();

    assert.deepEqual(
      violations,
      [],
      violations
        .slice(0, 20)
        .map(
          (item) =>
            `${item.language}[${item.index}] ${item.word}: ${item.rule}`,
        )
        .join("\n"),
    );
  });
});
