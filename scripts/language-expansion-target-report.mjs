import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const readText = (relativePath) =>
  readFileSync(new URL(relativePath, root), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const pathExists = (relativePath) => existsSync(new URL(relativePath, root));

const target = readJson("config/language-expansion-targets.json");
const assertComplete = process.argv.includes("--assert-complete");

const parseQuotedArray = (source, name) => {
  const match = source.match(new RegExp(`${name}\\s*=\\s*\\[([\\s\\S]*?)\\]`));
  assert.ok(match, `${name} array not found`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
};

const parseLocaleLanguageMap = () => {
  const source = readText("apps/web/lib/i18n/ground-code-language.ts");
  const pairs = [
    ...source.matchAll(/if \(locale === "([^"]+)"\) return "([^"]+)";/g),
  ];
  return new Map([
    ["english", "en"],
    ...pairs.map((item) => [item[2], item[1]]),
  ]);
};

const flattenLeaves = (value, path = [], leaves = new Map()) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flattenLeaves(child, [...path, key], leaves);
    }
    return leaves;
  }
  leaves.set(path.join("."), value);
  return leaves;
};

const translatedLeafCount = (locale) => {
  const messagesPath = `apps/web/messages/${locale}/index.json`;
  if (!pathExists(messagesPath)) return 0;

  const english = flattenLeaves(readJson("apps/web/messages/en/index.json"));
  const localized = flattenLeaves(readJson(messagesPath));
  let count = 0;
  for (const [path, englishValue] of english.entries()) {
    if (path === "common.languageName" || path === "common.languageCode") {
      continue;
    }
    if (localized.get(path) !== englishValue) count += 1;
  }
  return count;
};

const apiLanguages = new Set(
  parseQuotedArray(
    readText("apps/api-ground-codes/src/endpoints/v1/language.ts"),
    "supportedLanguages",
  ),
);
const webLocales = new Set(
  parseQuotedArray(readText("apps/web/i18n.ts"), "locales"),
);
const localeByLanguage = parseLocaleLanguageMap();
const codebooks = new Set(
  readdirSync(new URL("packages/codebook/codebook-dist", root))
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, "")),
);
const requiredRegionFiles = (language) => [
  `packages/geoint/region-dist/region-2-${language}.json`,
  `packages/geoint/region-dist/region-3-${language}.json`,
  `packages/geoint/region-dist/region-2-moon-${language}.json`,
  `packages/geoint/region-dist/region-2-mars-${language}.json`,
  `packages/geoint/region-dist/region-3-mars-${language}.json`,
];

const rows = target.languages.map((item) => {
  const locale = item.locale ?? localeByLanguage.get(item.language);
  const hasCodebook = codebooks.has(item.language);
  const hasApi = apiLanguages.has(item.language);
  const hasLocale = locale ? webLocales.has(locale) : false;
  const hasMessages = locale
    ? pathExists(`apps/web/messages/${locale}/index.json`)
    : false;
  const hasPlaceTypes = locale
    ? pathExists(`apps/web/messages/${locale}/placeTypes.json`)
    : false;
  const hasLocalizedRegions =
    item.language === "english" ||
    requiredRegionFiles(item.language).every((regionPath) =>
      pathExists(regionPath),
    );
  return {
    ...item,
    locale,
    hasCodebook,
    hasApi,
    hasLocale,
    hasMessages,
    hasPlaceTypes,
    translatedUiLeaves:
      item.language === "english"
        ? target.minimumTranslatedUiLeaves
        : locale
          ? translatedLeafCount(locale)
          : 0,
    hasLocalizedRegions,
  };
});

const supported = rows.filter(
  (row) =>
    row.hasCodebook &&
    row.hasApi &&
    row.hasLocale &&
    row.hasMessages &&
    row.hasPlaceTypes,
);
const fullLocalized = rows.filter(
  (row) =>
    row.hasCodebook &&
    row.hasApi &&
    row.hasLocale &&
    row.hasMessages &&
    row.hasPlaceTypes &&
    row.translatedUiLeaves >= target.minimumTranslatedUiLeaves &&
    row.hasLocalizedRegions,
);
const missingByCapability = {
  codebook: rows.filter((row) => !row.hasCodebook).map((row) => row.language),
  api: rows.filter((row) => !row.hasApi).map((row) => row.language),
  webLocale: rows.filter((row) => !row.hasLocale).map((row) => row.language),
  messages: rows.filter((row) => !row.hasMessages).map((row) => row.language),
  placeTypes: rows
    .filter((row) => !row.hasPlaceTypes)
    .map((row) => row.language),
  fullUiTranslation: rows
    .filter((row) => row.translatedUiLeaves < target.minimumTranslatedUiLeaves)
    .map((row) => row.language),
  localizedRegions: rows
    .filter((row) => !row.hasLocalizedRegions)
    .map((row) => row.language),
};

console.log(`Language expansion target: ${target.languages.length}`);
console.log(
  `Codebook/API/web scaffolded: ${supported.length}/${target.languages.length}`,
);
console.log(
  `Fully localized UI + regions: ${fullLocalized.length}/${target.languages.length}`,
);
for (const [capability, languages] of Object.entries(missingByCapability)) {
  console.log(
    `${capability}: ${target.languages.length - languages.length}/${target.languages.length}` +
      (languages.length
        ? `, missing ${languages.slice(0, 12).join(", ")}${languages.length > 12 ? "..." : ""}`
        : ""),
  );
}

if (assertComplete) {
  const incomplete = Object.entries(missingByCapability).filter(
    ([, languages]) => languages.length,
  );
  if (incomplete.length) {
    throw new Error(
      `Language expansion target is incomplete: ${incomplete
        .map(([capability, languages]) => `${capability}=${languages.length}`)
        .join(", ")}`,
    );
  }
}
