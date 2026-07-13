import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { reviewedLocales } from "./data/language-completeness-reviewed-locales.mjs";
import {
  addressingGapLanguages,
  flattenMessages,
  generatedEnglishPathScaffoldPattern,
  generatedEnglishSeeds,
  generatedLanguagePrefixPattern,
  generatedLanguageSuffixes,
  generatedLabelPrefixes,
  isGeneratedSlugScaffold,
  languageSuffix,
  parseEnglishRegionFallbackLanguages,
  parseSupportedLanguages,
  parseWordsetCounts,
  readText,
  root,
  slug,
  title,
} from "./language-support-completeness-helpers.mjs";

describe("language support completeness", () => {
  const languages = parseSupportedLanguages();

  test("includes the address-gap expansion languages", () => {
    assert.deepEqual(
      addressingGapLanguages.filter(
        (language) => !languages.includes(language),
      ),
      [],
    );
  });

  test("ships codebook and region assets for every supported language", () => {
    const counts = parseWordsetCounts();
    const englishRegionFallbackLanguages =
      parseEnglishRegionFallbackLanguages();
    const englishCodebook = new Set(
      JSON.parse(
        readFileSync(
          join(root, "packages/codebook/codebook-dist/english.json"),
          "utf8",
        ),
      ).map((word) => word.toLowerCase()),
    );

    for (const language of languages) {
      const codebookPath = join(
        root,
        "packages/codebook/codebook-dist",
        `${language}.json`,
      );
      assert.equal(existsSync(codebookPath), true, `${language} codebook`);

      const codebook = JSON.parse(readFileSync(codebookPath, "utf8"));
      assert.equal(codebook.length, counts[language], `${language} count`);
      assert.equal(
        new Set(codebook).size,
        codebook.length,
        `${language} unique codebook`,
      );

      const unsafeWords = codebook.filter(
        (word) => typeof word !== "string" || !/^[^\s/#?]+$/.test(word),
      );
      assert.deepEqual(
        unsafeWords.slice(0, 10),
        [],
        `${language} URL-safe codebook words`,
      );

      if (language !== "english") {
        const englishOverlap = codebook.filter((word) =>
          englishCodebook.has(word.toLowerCase()),
        );
        assert.deepEqual(
          englishOverlap,
          [],
          `${language} should not reuse exact English codebook words: ${englishOverlap
            .slice(0, 10)
            .join(", ")}`,
        );
      }

      const generatedLanguagePrefixScaffolds = codebook.filter((word) =>
        generatedLanguagePrefixPattern.test(word),
      );
      assert.deepEqual(
        generatedLanguagePrefixScaffolds,
        [],
        `${language} generated language-prefix scaffolds`,
      );

      const languageSlug = slug(language).slice(0, 6);
      const generatedEnglishPathScaffolds = codebook.filter(
        (word, index) =>
          index >= 700 &&
          word.toLowerCase().includes(languageSlug) &&
          generatedEnglishPathScaffoldPattern.test(word),
      );
      assert.deepEqual(
        generatedEnglishPathScaffolds,
        [],
        `${language} generated English path scaffolds`,
      );

      const generatedSlugScaffolds = codebook.filter((word, index) =>
        isGeneratedSlugScaffold(language, index, word),
      );
      assert.deepEqual(
        generatedSlugScaffolds,
        [],
        `${language} generated language-slug scaffolds`,
      );

      const suffix = englishRegionFallbackLanguages.has(language)
        ? ""
        : languageSuffix(language);
      for (const dataset of [
        `region-2${suffix}.json`,
        `region-3${suffix}.json`,
        `region-2-moon${suffix}.json`,
        `region-2-mars${suffix}.json`,
        `region-3-mars${suffix}.json`,
      ]) {
        assert.equal(
          existsSync(join(root, "packages/geoint/region-dist", dataset)),
          true,
          `${language} ${dataset}`,
        );
      }
    }
  });

  test("covers every API language in production smoke", () => {
    const smokeSource = readText("scripts/production-smoke.mjs");
    const smokeLanguages = new Set(
      [...smokeSource.matchAll(/language:\s*"([^"]+)"/g)].map(
        (item) => item[1],
      ),
    );

    assert.deepEqual(
      languages.filter((language) => !smokeLanguages.has(language)),
      [],
    );
  });

  test("documents quality status for every distributed language", () => {
    const doc = readText("packages/codebook/LANGUAGE_QUALITY.md");

    for (const language of languages) {
      assert.match(doc, new RegExp(`\\|\\s+${language}\\s+\\|`));
    }
  });

  test("keeps reviewed UI strings free of scaffold markers", () => {
    const englishPlaceTypes = JSON.parse(
      readText("apps/web/messages/en/placeTypes.json"),
    );
    const englishMessages = flattenMessages(
      JSON.parse(readText("apps/web/messages/en/index.json")),
    );
    const allowedExactEnglishMessages = new Set([
      "common.groundCode",
      "map.bodies.mars",
      "map.groundCode",
      "map.search.groundCodesHeading",
    ]);
    const stablePlaceTypeLocales = new Set(reviewedLocales);

    for (const locale of reviewedLocales) {
      const messages = readText(`apps/web/messages/${locale}/index.json`);
      const placeTypes = readText(
        `apps/web/messages/${locale}/placeTypes.json`,
      );
      const languageName = JSON.parse(messages).common?.languageName;
      const localizedMessages = flattenMessages(JSON.parse(messages));
      const localizedPlaceTypes = JSON.parse(placeTypes);
      const scaffoldPrefixes = [languageName, locale]
        .filter(Boolean)
        .map((prefix) => `${prefix}: `);

      assert.equal(messages.includes(" · "), false, locale);
      assert.equal(placeTypes.includes(" · "), false, locale);
      for (const prefix of scaffoldPrefixes) {
        assert.equal(
          messages.includes(prefix),
          false,
          `${locale} messages ${prefix}`,
        );
        assert.equal(
          placeTypes.includes(prefix),
          false,
          `${locale} placeTypes ${prefix}`,
        );
      }
      for (const [key, englishLabel] of Object.entries(englishPlaceTypes)) {
        assert.notEqual(
          localizedPlaceTypes[key],
          englishLabel,
          `${locale} placeTypes ${key}`,
        );
        if (stablePlaceTypeLocales.has(locale)) {
          assert.equal(
            localizedPlaceTypes[key].startsWith(`${englishLabel} `) ||
              localizedPlaceTypes[key].endsWith(` ${englishLabel}`),
            false,
            `${locale} placeTypes ${key} should not wrap English label scaffold`,
          );
        }
      }
      assert.equal(
        /^RV Park\b/.test(localizedPlaceTypes.rv_park ?? ""),
        false,
        `${locale} placeTypes rv_park should not expose RV Park scaffold`,
      );
      for (const [key, englishLabel] of Object.entries(englishMessages)) {
        if (allowedExactEnglishMessages.has(key)) {
          continue;
        }
        assert.notEqual(
          localizedMessages[key],
          englishLabel,
          `${locale} messages ${key}`,
        );
        assert.equal(
          localizedMessages[key].startsWith(`${englishLabel} `) ||
            localizedMessages[key].endsWith(` ${englishLabel}`),
          false,
          `${locale} messages ${key} should not wrap English label scaffold`,
        );
      }
    }
  });

  test("keeps region and address-gap codebook quality audits in the scripted QA set", () => {
    const qaScript = readText("package.json");
    const scripts = readText("scripts/address-gap-codebook-quality.test.mjs");

    assert.match(qaScript, /region-label-quality\.test\.mjs/);
    assert.match(qaScript, /scripts\/\*\.test\.mjs/);
    assert.match(scripts, /mechanical two-word fusions/);
  });
});
