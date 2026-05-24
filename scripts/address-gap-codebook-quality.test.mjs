import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const languages = [
  "swahili",
  "filipino",
  "hausa",
  "bengali",
  "urdu",
  "amharic",
];

const readCodebook = (language) =>
  JSON.parse(
    readFileSync(
      new URL(
        `../packages/codebook/codebook-dist/${language}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );

const lexicalizedFusions = {
  amharic: new Set(["ዳቦቤት"]),
};

const isFusedFromEarlierWords = (word, earlierWords) => {
  for (const left of earlierWords) {
    if (!word.startsWith(left) || left.length === word.length) continue;
    const right = word.slice(left.length);
    if (earlierWords.has(right)) return true;
  }
  return false;
};

describe("address-gap codebook quality", () => {
  test("keeps the first 220 entries free of mechanical two-word fusions", () => {
    for (const language of languages) {
      const words = readCodebook(language).slice(0, 220);
      const earlierWords = new Set();
      const fused = [];

      for (const word of words) {
        if (
          !lexicalizedFusions[language]?.has(word) &&
          isFusedFromEarlierWords(word, earlierWords)
        ) {
          fused.push(word);
        }
        earlierWords.add(word);
      }

      assert.deepEqual(
        fused,
        [],
        `${language} front-loaded mechanical fusions: ${fused
          .slice(0, 10)
          .join(", ")}`,
      );
    }
  });
});
