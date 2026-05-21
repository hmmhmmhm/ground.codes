import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { auditCodebooks, EXPECTED_COUNTS } from "./codebook-policy-audit.mjs";

const makeHangulFixtures = (count) => {
  const lead = ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차"];
  const middle = ["구", "누", "두", "루", "무", "부", "수", "우", "주", "추"];
  const tail = ["기", "니", "디", "리", "미", "비", "시", "이", "지", "치"];
  const words = [];

  for (const a of lead) {
    for (const b of middle) {
      for (const c of tail) {
        for (const d of lead) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Hangul fixtures`);
};

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

  test("flags Korean cleanup patterns that make poor public address words", () => {
    const { violations } = auditCodebooks({
      english: Array.from(
        { length: EXPECTED_COUNTS.english },
        (_, index) => `Word${index}`,
      ),
      korean: [
        "조약돌광목포",
        "정겨운도토리",
        "정",
        "솔방울두루마리",
        "비화이트리스트",
        ...makeHangulFixtures(EXPECTED_COUNTS.korean - 5),
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

    const actual = new Set(
      violations
        .filter((item) => item.language === "korean")
        .map((item) => `${item.word}:${item.rule}`),
    );

    for (const [word, rule] of [
        ["조약돌광목포", "korean-generated-material-compound"],
        ["정겨운도토리", "korean-poetic-adjective-compound"],
        ["정", "korean-weak-one-syllable"],
        ["솔방울두루마리", "korean-too-long"],
        ["비화이트리스트", "korean-unapproved-loanword"],
      ]) {
      assert.equal(actual.has(`${word}:${rule}`), true, `${word}: ${rule}`);
    }
  });
});
