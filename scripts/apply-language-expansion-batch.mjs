import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import {
  commonSeeds,
  labelPrefixes,
  labelSuffixes,
} from "./data/language-expansion-codebook-seeds.mjs";
import { assertMaterializedRegionData } from "./region-data/materialization.mjs";

assertMaterializedRegionData();
const root = new URL("../", import.meta.url);
const targetLength = 5000;

const readText = (filePath) => readFileSync(new URL(filePath, root), "utf8");
const writeText = (filePath, value) =>
  writeFileSync(new URL(filePath, root), value);
const readJson = (filePath) => JSON.parse(readText(filePath));
const writeJson = (filePath, value) =>
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
const pathExists = (filePath) => existsSync(new URL(filePath, root));

const argValue = (name, fallback) => {
  const prefix = `${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
};

const batchSize = Number(argValue("--count", "5"));
if (!Number.isInteger(batchSize) || batchSize < 1) {
  throw new Error("--count must be a positive integer");
}
const languageArg = argValue("--languages", "");
const requestedLanguages = languageArg
  ? new Set(
      languageArg
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    )
  : null;

const parseQuotedArray = (source, name) => {
  const match = source.match(new RegExp(`${name}\\s*=\\s*\\[([\\s\\S]*?)\\]`));
  if (!match) throw new Error(`${name} array not found`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
};

const appendBefore = (filePath, marker, lines, sectionStart = "") => {
  const source = readText(filePath);
  const startIndex = sectionStart ? source.indexOf(sectionStart) : 0;
  if (startIndex === -1) {
    throw new Error(`${filePath}: section start not found`);
  }
  const markerIndex = source.indexOf(marker, startIndex);
  if (markerIndex === -1) throw new Error(`${filePath}: marker not found`);
  const section = source.slice(startIndex, markerIndex);
  const missingLines = lines.filter((line) => !section.includes(line));
  if (!missingLines.length) return;
  const prefix =
    markerIndex > 0 && source[markerIndex - 1] !== "\n" ? "\n" : "";
  writeText(
    filePath,
    `${source.slice(0, markerIndex)}${prefix}${missingLines.join(
      "\n",
    )}\n${source.slice(markerIndex)}`,
  );
};

const appendBeforeLast = (filePath, marker, lines, sectionStart = "") => {
  const source = readText(filePath);
  const markerIndex = source.lastIndexOf(marker);
  if (markerIndex === -1) throw new Error(`${filePath}: marker not found`);
  const startIndex = sectionStart
    ? source.lastIndexOf(sectionStart, markerIndex)
    : 0;
  if (startIndex === -1) {
    throw new Error(`${filePath}: section start not found`);
  }
  const section = source.slice(startIndex, markerIndex);
  const missingLines = lines.filter((line) => !section.includes(line));
  if (!missingLines.length) return;
  const prefix =
    markerIndex > 0 && source[markerIndex - 1] !== "\n" ? "\n" : "";
  writeText(
    filePath,
    `${source.slice(0, markerIndex)}${prefix}${missingLines.join(
      "\n",
    )}\n${source.slice(markerIndex)}`,
  );
};

const target = readJson("config/language-expansion-targets.json");
const apiSource = readText(
  "apps/api-ground-codes/src/endpoints/v1/language.ts",
);
const currentLanguages = new Set(
  parseQuotedArray(apiSource, "supportedLanguages"),
);
const selected = requestedLanguages
  ? target.languages.filter((item) => requestedLanguages.has(item.language))
  : target.languages
      .filter((item) => !currentLanguages.has(item.language))
      .slice(0, batchSize);

if (!selected.length) {
  console.log("No missing target languages to add.");
  process.exit(0);
}

if (requestedLanguages && selected.length !== requestedLanguages.size) {
  const selectedLanguages = new Set(selected.map((item) => item.language));
  const missing = [...requestedLanguages].filter(
    (language) => !selectedLanguages.has(language),
  );
  throw new Error(`Unknown target languages: ${missing.join(", ")}`);
}

const slug = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^x+/, "") || "word";
const title = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const displayName = (spec) =>
  String(spec.englishName ?? spec.language)
    .split(";")[0]
    .trim();

const buildCodebook = (spec) => {
  const prefix = slug(spec.language).slice(0, 6);
  const words = [];
  const seen = new Set();
  const add = (word) => {
    if (!word || seen.has(word)) return;
    seen.add(word);
    words.push(title(word));
  };

  for (const seed of commonSeeds) add(`${prefix}${title(seed)}`);
  for (const labelPrefix of labelPrefixes) {
    for (const seed of commonSeeds) {
      if (words.length >= targetLength) return words;
      add(`${prefix}${title(labelPrefix)}${title(seed)}`);
    }
  }
  for (const labelSuffix of labelSuffixes) {
    for (const seed of commonSeeds) {
      if (words.length >= targetLength) return words;
      add(`${prefix}${title(seed)}${title(labelSuffix)}`);
    }
  }
  for (const labelPrefix of labelPrefixes) {
    for (const labelSuffix of labelSuffixes) {
      for (const seed of commonSeeds) {
        if (words.length >= targetLength) return words;
        add(
          `${prefix}${title(labelPrefix)}${title(seed)}${title(labelSuffix)}`,
        );
      }
    }
  }
  if (words.length !== targetLength) {
    throw new Error(`${spec.language} generated ${words.length} words`);
  }
  return words;
};

const normalizeRegionLabel = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`´/#?\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const truncateLabel = (value, maxLength) => {
  if ([...value].length <= maxLength) return value;
  const suffixMatch = value.match(/^(.*?)( \d+)$/);
  if (suffixMatch) {
    const [, head, suffix] = suffixMatch;
    return `${[...head]
      .slice(0, Math.max(1, maxLength - suffix.length))
      .join("")
      .trim()}${suffix}`;
  }
  return [...value].slice(0, maxLength).join("").trim();
};

const numericSuffixSources = new Set([
  "natural-earth-marine",
  "synthetic-antarctic-grid",
  "synthetic-arctic-grid",
  "synthetic-sahara-grid",
]);

const translateRegionName = (row) => normalizeRegionLabel(row.name);

const localizedRows = (spec, inputPath, maxLength) => {
  const seen = new Set();
  return readJson(inputPath).map((row, index) => {
    const suffixSource =
      numericSuffixSources.has(row.source) ||
      row.source === "synthetic-named-gap";
    const numericSuffix =
      String(row.code ?? "")
        .match(/\d+/g)
        ?.join("") || String(index + 1);
    const translated = translateRegionName(row);
    let name =
      suffixSource && !/\d+$/.test(translated)
        ? `${translated} ${numericSuffix}`
        : translated;
    let base = truncateLabel(name, maxLength);
    let candidate = base || String(row.code);
    let dedupeIndex = 2;
    while (seen.has(candidate.toLocaleLowerCase())) {
      const dedupeSuffix = ` ${dedupeIndex}`;
      const trimmed = [...base]
        .slice(0, Math.max(1, maxLength - dedupeSuffix.length))
        .join("")
        .trim();
      candidate = `${trimmed}${dedupeSuffix}`;
      dedupeIndex += 1;
    }
    seen.add(candidate.toLocaleLowerCase());
    return { ...row, name: candidate };
  });
};

const englishMessages = readJson("apps/web/messages/en/index.json");
const englishPlaceTypes = readJson("apps/web/messages/en/placeTypes.json");

for (const spec of selected) {
  writeJson(
    `packages/codebook/codebook-dist/${spec.language}.json`,
    buildCodebook(spec),
  );

  for (const [input, output, maxLength] of [
    [
      "packages/geoint/region-dist/region-2.json",
      `packages/geoint/region-dist/region-2-${spec.language}.json`,
      36,
    ],
    [
      "packages/geoint/region-dist/region-3.json",
      `packages/geoint/region-dist/region-3-${spec.language}.json`,
      20,
    ],
    [
      "packages/geoint/region-dist/region-2-moon.json",
      `packages/geoint/region-dist/region-2-moon-${spec.language}.json`,
      48,
    ],
    [
      "packages/geoint/region-dist/region-2-mars.json",
      `packages/geoint/region-dist/region-2-mars-${spec.language}.json`,
      48,
    ],
    [
      "packages/geoint/region-dist/region-3-mars.json",
      `packages/geoint/region-dist/region-3-mars-${spec.language}.json`,
      48,
    ],
  ]) {
    writeJson(output, localizedRows(spec, input, maxLength));
  }

  mkdirSync(new URL(`apps/web/messages/${spec.locale}/`, root), {
    recursive: true,
  });
  writeJson(`apps/web/messages/${spec.locale}/index.json`, {
    ...englishMessages,
    common: {
      ...englishMessages.common,
      languageName: spec.nativeName ?? spec.englishName,
      languageCode: spec.locale,
    },
  });
  writeJson(
    `apps/web/messages/${spec.locale}/placeTypes.json`,
    englishPlaceTypes,
  );
}

const languageLines = selected.map((item) => `  "${item.language}",`);
const localeLines = selected.map((item) => `  "${item.locale}",`);

appendBefore(
  "apps/api-ground-codes/src/endpoints/v1/language.ts",
  "] as const;",
  languageLines,
  "const supportedLanguages",
);
appendBefore("apps/web/i18n.ts", "] as const;", localeLines, "const locales");
appendBefore(
  "packages/ground-codes/src/wordset-language.ts",
  '  | "cantonese";',
  selected.map((item) => `  | "${item.language}"`),
  "export type SupportedLanguage",
);
appendBefore(
  "packages/ground-codes/src/wordset-language.ts",
  "};",
  selected.map((item) => `  ${item.language}: 5000,`),
  "export const wordSetBaseCount",
);
appendBefore(
  "packages/ground-codes/src/wordset-loader-secondary.ts",
  "\n  }\n\n  return null;",
  selected.map(
    (item) =>
      `  } else if (language.toLowerCase() === "${item.language}") {\n    // @ts-ignore\n    return (await import("@repo/codebook/codebook-dist/${item.language}.json"))\n      .default as string[];`,
  ),
  "export const loadSecondaryWordSet",
);
appendBefore(
  "packages/ground-codes/src/region-languages.ts",
  "]);\n\nexport const addressGapLanguages",
  languageLines,
  "const regionSupportedLanguages",
);
appendBefore(
  "packages/ground-codes/src/region-languages.ts",
  "]);\n\nexport const englishRegionFallbackLanguages",
  languageLines,
  "const addressGapLanguages",
);
appendBefore(
  "apps/web/lib/i18n/ground-code-language.ts",
  '  return "english";',
  selected.map(
    (item) => `  if (locale === "${item.locale}") return "${item.language}";`,
  ),
  "export const getGroundCodeLanguage",
);
appendBefore(
  "apps/web/components/google-map/map-control-labels.ts",
  "};\n\nexport const LOCALE_SHORT_LABELS",
  selected.map(
    (item) => `  ${item.locale}: "${item.nativeName ?? item.englishName}",`,
  ),
  "export const LOCALE_LABELS",
);
appendBeforeLast(
  "apps/web/components/google-map/map-control-labels.ts",
  "};\n",
  selected.map((item) => `  ${item.locale}: "${item.locale.toUpperCase()}",`),
  "export const LOCALE_SHORT_LABELS",
);
appendBefore(
  "apps/web/components/google-map/place-details/types.ts",
  "\nexport interface PlaceDetailsProps",
  selected.map(
    (item) =>
      `import ${item.locale}PlaceTypes from "@/messages/${item.locale}/placeTypes.json";`,
  ),
  "import",
);
appendBeforeLast(
  "apps/web/components/google-map/place-details/types.ts",
  "};\n",
  selected.map(
    (item) => `  ${item.locale}: ${item.locale}PlaceTypes as PlaceTypesRecord,`,
  ),
  "export const placeTypes",
);
appendBefore(
  "scripts/production-smoke.mjs",
  "]) {\n  await smoke.check(`${label} Seoul encode`, async () => {",
  selected.map(
    (item) =>
      `  { label: "${displayName(item)}", language: "${item.language}", prefix: "${item.locale.toUpperCase()} Seoul" },`,
  ),
  "for (const { label, language, prefix } of [",
);
appendBefore(
  "packages/codebook/LANGUAGE_QUALITY.md",
  "\nReview checklist:",
  selected.map(
    (item) =>
      `| ${item.language.padEnd(15)} |  5000 | active cleanup | 180-language batch scaffolds ${displayName(item)} codewords and prefixed region labels; native review must replace generated fallback vocabulary. |`,
  ),
);

console.log(`Added ${selected.length} target languages:`);
for (const spec of selected) {
  console.log(`- ${spec.language} (${spec.locale})`);
}
