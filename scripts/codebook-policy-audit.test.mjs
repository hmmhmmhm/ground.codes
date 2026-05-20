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

  test("flags Korean entries that differ only by common pronunciation confusions", () => {
    const { violations } = auditCodebooks({
      english: Array.from(
        { length: EXPECTED_COUNTS.english },
        (_, index) => `Word${index}`,
      ),
      korean: [
        "나무채반",
        "나무체반",
        ...Array.from(
          { length: EXPECTED_COUNTS.korean - 2 },
          (_, index) => `테스트${index}`,
        ),
      ],
      chinese: Array.from(
        { length: EXPECTED_COUNTS.chinese },
        (_, index) => `词${index}`,
      ),
      japanese: Array.from(
        { length: EXPECTED_COUNTS.japanese },
        (_, index) => `ことば${index}`,
      ),
      spanish: Array.from(
        { length: EXPECTED_COUNTS.spanish },
        (_, index) => `Palabra${index}`,
      ),
    });

    assert.deepEqual(
      violations.filter(
        (item) => item.rule === "korean-pronunciation-collision",
      ),
      [
        {
          language: "korean",
          index: 1,
          word: "나무체반",
          rule: "korean-pronunciation-collision",
          detail: 'Sounds like index 0 "나무채반" under Korean confusion groups',
        },
      ],
    );
  });
});
