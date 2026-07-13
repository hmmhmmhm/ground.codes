import assert from "node:assert/strict";

import {
  languages,
  lexicalizedFusions,
  frontLoadedExpectedWords,
} from "./data/address-gap-quality-reviewed.mjs";
import {
  oldSyllableFallbackExamples,
  earlyEnglishFallbackExamples,
  generatedLanguagePrefixExamples,
} from "./data/address-gap-quality-generated.mjs";
import {
  generatedLanguagePrefixScanLimits,
  extendedFusionScanLimits,
  strippedTransliterationFragments,
  reviewedNativeLexicalBlocklist,
} from "./data/address-gap-quality-limits.mjs";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

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

const generatedLowercaseEnglishSeedSuffixPattern =
  /(?:leaf|moon|morning|moss|mortar|water|home|river|hill|flower|book|school|market|tree|road|bridge|notebook|driver|springwater|garden|field|basket|chair|table|window|door|gate|phone|family|friend|child|teacher|doctor|farmer|hotel|station|garlic|bamboo)$/;

const generatedStandaloneEnglishSeedPattern =
  /^[A-Z][a-z]+(?:leaf|moon|morning|moss|mortar|water|home|river|hill|flower|book|school|market|tree|road|bridge|notebook|driver|springwater|garden|field|basket|chair|table|window|door|gate|phone|family|friend|child|teacher|doctor|farmer|hotel|station|garlic|bamboo)$/;

const standaloneEnglishSeedExamples = new Set([
  "Garlic",
  "Bamboo",
  "Family",
  "Friend",
  "Child",
  "Teacher",
  "Doctor",
  "Farmer",
  "Hotel",
  "Station",
  "Road",
  "Bridge",
  "Market",
  "Basket",
  "Garden",
  "Field",
  "Chair",
  "Table",
  "Window",
  "Door",
  "Gate",
  "Phone",
  "Driver",
  "Springwater",
  "Mortar",
  "Notebook",
]);

const slug = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^x+/, "") || "word";

const isFusedFromEarlierWords = (word, earlierWords) => {
  for (const left of earlierWords) {
    if (!word.startsWith(left) || left.length === word.length) continue;
    const right = word.slice(left.length);
    if ([...left].length < 3 || [...right].length < 3) continue;
    if (earlierWords.has(right)) return true;
  }
  return false;
};

const firstCharLower = (word) => {
  const chars = [...word];
  return `${chars[0]?.toLocaleLowerCase() ?? ""}${chars.slice(1).join("")}`;
};

const addWordForms = (forms, word) => {
  forms.add(word);
  forms.add(firstCharLower(word));
};

const isFusedFromEarlierWordForms = (word, earlierForms) => {
  for (const left of earlierForms) {
    if (!word.startsWith(left) || left.length === word.length) continue;
    const right = word.slice(left.length);
    if ([...left].length < 3 || [...right].length < 3) continue;
    if (earlierForms.has(right)) return true;
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

  test("front-loads reviewed standalone seeds before synthetic fallback", () => {
    for (const [language, expectedWords] of Object.entries(
      frontLoadedExpectedWords,
    )) {
      const words = readCodebook(language).slice(0, 140);
      for (const word of expectedWords) {
        assert.ok(
          words.includes(word),
          `${language} should front-load ${word}`,
        );
      }
    }
  });

  test("keeps extended reviewed windows free of mechanical fusions", () => {
    for (const [language, limit] of Object.entries(extendedFusionScanLimits)) {
      const words = readCodebook(language).slice(0, limit);
      const earlierForms = new Set();
      const fused = [];

      for (const word of words) {
        if (isFusedFromEarlierWordForms(word, earlierForms)) {
          fused.push(word);
        }
        addWordForms(earlierForms, word);
      }

      assert.deepEqual(
        fused,
        [],
        `${language} first ${limit} entries should not expose mechanical fusions`,
      );
    }
  });

  test("keeps old generated syllable filler out of the first 140 entries", () => {
    for (const [language, blockedWords] of Object.entries(
      oldSyllableFallbackExamples,
    )) {
      const words = readCodebook(language).slice(0, 140);
      assert.deepEqual(
        words.filter((word) => blockedWords.includes(word)),
        [],
        `${language} should not expose old syllable filler early`,
      );
    }
  });

  test("keeps early English fallback out of reviewed codebooks", () => {
    for (const [language, blockedWords] of Object.entries(
      earlyEnglishFallbackExamples,
    )) {
      const words = readCodebook(language).slice(0, 300);
      assert.deepEqual(
        words.filter((word) => blockedWords.includes(word)),
        [],
        `${language} should not expose early English fallback`,
      );
    }
  });

  test("keeps generated language-prefix scaffolds out of reviewed codebooks", () => {
    for (const [language, blockedWords] of Object.entries(
      generatedLanguagePrefixExamples,
    )) {
      const limit = generatedLanguagePrefixScanLimits[language] ?? 120;
      const words = readCodebook(language).slice(0, limit);
      assert.deepEqual(
        words.filter((word) => blockedWords.includes(word)),
        [],
        `${language} should not expose generated language-prefix scaffolds`,
      );
    }
  });

  test("keeps stripped transliteration fragments out of early Latin codebooks", () => {
    for (const language of [
      "bambara",
      "fula",
      "wolof",
      "ewe",
      "fon",
      "aymara",
      "guarani",
    ]) {
      const words = readCodebook(language).slice(0, 220);
      assert.deepEqual(
        words.filter((word) =>
          strippedTransliterationFragments.some((fragment) =>
            word.includes(fragment),
          ),
        ),
        [],
        `${language} should not contain stripped transliteration fragments`,
      );
    }
  });

  test("keeps reviewed native lexical cleanup examples out of codebooks", () => {
    for (const [language, blockedWords] of Object.entries(
      reviewedNativeLexicalBlocklist,
    )) {
      const words = readCodebook(language);
      assert.deepEqual(
        words.filter((word) =>
          blockedWords.some((blockedWord) => word.includes(blockedWord)),
        ),
        [],
        `${language} should not retain reviewed rough lexical forms`,
      );
    }

    const esperantoWords = readCodebook("esperanto");
    assert.deepEqual(
      esperantoWords.filter((word) => /[CcGgHhJjSsUu]x/.test(word)),
      [],
      "esperanto should use Unicode diacritics instead of x-system forms",
    );
  });

  test("keeps generated lowercase English seed suffixes out of reviewed codebook tails", () => {
    for (const language of languages) {
      const languageSlug = slug(language).slice(0, 6);
      const words = readCodebook(language);
      const generatedSuffixes = words
        .map((word, index) => ({ index, word }))
        .filter(({ index, word }) => {
          if (index >= 250 && standaloneEnglishSeedExamples.has(word)) {
            return true;
          }
          return (
            index >= 700 &&
            generatedLowercaseEnglishSeedSuffixPattern.test(word) &&
            (languages.includes(language) ||
              word.toLowerCase().includes(languageSlug) ||
              generatedStandaloneEnglishSeedPattern.test(word))
          );
        });

      assert.deepEqual(
        generatedSuffixes.slice(0, 10),
        [],
        `${language} should not expose generated lowercase English seed suffixes`,
      );
    }
  });
});
