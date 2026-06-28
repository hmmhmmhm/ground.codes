import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { decodeByWordSet, encodeByWordSet } from "../src/index.js";
import type { SupportedLanguage } from "../src/wordset.js";

const requireJson = createRequire(import.meta.url);
const codebookPath = (language: string) =>
  fileURLToPath(
    new URL(`../../codebook/codebook-dist/${language}.json`, import.meta.url),
  );
const targetManifest = requireJson(
  "../../../config/language-expansion-targets.json",
) as {
  languages: Array<{
    language: SupportedLanguage;
    source: string;
  }>;
};

const hasCodebook = (language: string) => existsSync(codebookPath(language));

const scaffoldedTargets = targetManifest.languages
  .filter((item) => item.source === "iso-639-1-loc")
  .filter((item) => hasCodebook(item.language));

describe("180-language expansion batch word sets", () => {
  test("manifest includes generated target word sets", () => {
    assert.ok(scaffoldedTargets.length >= 5);
  });

  for (const { language } of scaffoldedTargets) {
    test(`${language} ships a unique 5000-word codebook`, () => {
      const words = requireJson(codebookPath(language)) as string[];

      assert.equal(words.length, 5000);
      assert.equal(new Set(words).size, words.length);
      assert.equal(
        words.every((word) => word.length > 0 && !/\s|-/.test(word)),
        true,
      );
    });

    test(`${language} roundtrips generated word-set codes`, async () => {
      const encoded = await encodeByWordSet({ n: 123456789, language });
      assert.equal(await decodeByWordSet({ encoded, language }), 123456789);
    });
  }
});
