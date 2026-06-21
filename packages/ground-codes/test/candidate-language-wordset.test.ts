import assert from "node:assert/strict";
import { describe, test } from "node:test";

import cantonese from "@repo/codebook/codebook-dist/cantonese.json";
import gujarati from "@repo/codebook/codebook-dist/gujarati.json";
import kannada from "@repo/codebook/codebook-dist/kannada.json";
import malayalam from "@repo/codebook/codebook-dist/malayalam.json";
import marathi from "@repo/codebook/codebook-dist/marathi.json";
import persian from "@repo/codebook/codebook-dist/persian.json";
import telugu from "@repo/codebook/codebook-dist/telugu.json";
import yoruba from "@repo/codebook/codebook-dist/yoruba.json";

const fixtures = [
  {
    language: "marathi",
    words: marathi,
    nativePattern: /[\u0900-\u097f]/,
    rejected: [/Village/i, /Street/i, /Road/i],
    expected: ["घर", "पाणी", "नदी", "शाळा", "रस्ता"],
  },
  {
    language: "telugu",
    words: telugu,
    nativePattern: /[\u0c00-\u0c7f]/,
    rejected: [/Village/i, /Street/i, /Road/i],
    expected: ["ఇల్లు", "నీరు", "నది", "పాఠశాల", "రహదారి"],
  },
  {
    language: "gujarati",
    words: gujarati,
    nativePattern: /[\u0a80-\u0aff]/,
    rejected: [/Village/i, /Street/i, /Road/i],
    expected: ["ઘર", "પાણી", "નદી", "શાળા", "રસ્તો"],
  },
  {
    language: "kannada",
    words: kannada,
    nativePattern: /[\u0c80-\u0cff]/,
    rejected: [/Village/i, /Street/i, /Road/i],
    expected: ["ಮನೆ", "ನೀರು", "ನದಿ", "ಶಾಲೆ", "ರಸ್ತೆ"],
  },
  {
    language: "malayalam",
    words: malayalam,
    nativePattern: /[\u0d00-\u0d7f]/,
    rejected: [/Village/i, /Street/i, /Road/i],
    expected: ["വീട്", "വെള്ളം", "നദി", "സ്കൂൾ", "വഴി"],
  },
  {
    language: "yoruba",
    words: yoruba,
    nativePattern: /^[A-Za-zÀ-ỹ\u0300-\u036f]+$/,
    rejected: [/Village/i, /Street/i, /Road/i],
    expected: ["Ilé", "Omi", "Odò", "Ìwé", "Ọ̀nà"],
  },
  {
    language: "persian",
    words: persian,
    nativePattern: /[\u0600-\u06ff]/,
    rejected: [/Village/i, /Street/i, /Road/i],
    expected: ["خانه", "آب", "رود", "مدرسه", "راه"],
  },
  {
    language: "cantonese",
    words: cantonese,
    nativePattern: /[\u4e00-\u9fff]/,
    rejected: [/Village/i, /Street/i, /Road/i],
    expected: ["屋", "水", "河", "學校", "路"],
  },
];

describe("candidate language codebooks", () => {
  for (const {
    language,
    words,
    nativePattern,
    rejected,
    expected,
  } of fixtures) {
    test(`${language} ships a native-script 5000-word codebook`, () => {
      assert.equal(words.length, 5000);
      assert.equal(new Set(words).size, words.length);
      assert.equal(
        words.every((word) => word.length > 0 && !/\s|-/.test(word)),
        true,
      );
      assert.equal(
        words.slice(0, 400).every((word) => nativePattern.test(word)),
        true,
      );

      for (const word of expected) {
        assert.equal(words.includes(word), true, `${word} should be present`);
      }

      for (const pattern of rejected) {
        assert.equal(
          words.some((word) => pattern.test(word)),
          false,
          `${pattern} should be absent`,
        );
      }
    });
  }
});
