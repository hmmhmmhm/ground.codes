import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const readText = (relativePath) =>
  readFileSync(join(root, relativePath), "utf8");

const parseSupportedLanguages = () => {
  const source = readText("apps/api-ground-codes/src/endpoints/v1/language.ts");
  const match = source.match(/supportedLanguages\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(match, "supportedLanguages array not found");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
};

const parseWordsetCounts = () => {
  const source = readText("packages/ground-codes/src/wordset.ts");
  const match = source.match(/wordSetBaseCount[^=]*=\s*\{([\s\S]*?)\}/);
  assert.ok(match, "wordSetBaseCount object not found");
  return Object.fromEntries(
    [...match[1].matchAll(/(\w+):\s*(\d+)/g)].map(([, language, count]) => [
      language,
      Number(count),
    ]),
  );
};

const languageSuffix = (language) => (language === "english" ? "" : `-${language}`);
const addressingGapLanguages = [
  "swahili",
  "filipino",
  "hausa",
  "bengali",
  "urdu",
  "amharic",
];

describe("language support completeness", () => {
  const languages = parseSupportedLanguages();

  test("includes the address-gap expansion languages", () => {
    assert.deepEqual(
      addressingGapLanguages.filter((language) => !languages.includes(language)),
      [],
    );
  });

  test("ships codebook and region assets for every supported language", () => {
    const counts = parseWordsetCounts();

    for (const language of languages) {
      const codebookPath = join(
        root,
        "packages/codebook/codebook-dist",
        `${language}.json`,
      );
      assert.equal(existsSync(codebookPath), true, `${language} codebook`);

      const codebook = JSON.parse(readFileSync(codebookPath, "utf8"));
      assert.equal(codebook.length, counts[language], `${language} count`);

      for (const dataset of [
        `region-2${languageSuffix(language)}.json`,
        `region-3${languageSuffix(language)}.json`,
        `region-2-moon${languageSuffix(language)}.json`,
        `region-2-mars${languageSuffix(language)}.json`,
        `region-3-mars${languageSuffix(language)}.json`,
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
      assert.match(doc, new RegExp(`\\| ${language} \\|`));
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
