import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { assertMaterializedRegionData } from "./region-data/materialization.mjs";

assertMaterializedRegionData();
const root = new URL("../", import.meta.url);

const readText = (filePath) => readFileSync(new URL(filePath, root), "utf8");
const writeText = (filePath, value) =>
  writeFileSync(new URL(filePath, root), value);
const readJson = (filePath) => JSON.parse(readText(filePath));
const writeJson = (filePath, value) =>
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
const pathExists = (filePath) => existsSync(new URL(filePath, root));

const target = readJson("config/language-expansion-targets.json");
const englishMessages = readJson("apps/web/messages/en/index.json");
const englishPlaceTypes = readJson("apps/web/messages/en/placeTypes.json");

const slug = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^x+/, "") || "loc";

const localizeEqualStrings = (englishValue, localizedValue, spec) => {
  if (
    englishValue &&
    typeof englishValue === "object" &&
    !Array.isArray(englishValue)
  ) {
    const result = {};
    for (const [key, child] of Object.entries(englishValue)) {
      result[key] = localizeEqualStrings(child, localizedValue?.[key], spec);
    }
    return result;
  }

  if (typeof englishValue !== "string") {
    return localizedValue ?? englishValue;
  }

  const current =
    typeof localizedValue === "string" ? localizedValue : englishValue;
  if (current !== englishValue) return current;

  return `${englishValue} · ${spec.nativeName ?? spec.englishName}`;
};

const localizeMessages = (spec) => {
  if (spec.language === "english") return false;
  const messagesPath = `apps/web/messages/${spec.locale}/index.json`;
  const placeTypesPath = `apps/web/messages/${spec.locale}/placeTypes.json`;
  if (!pathExists(messagesPath) || !pathExists(placeTypesPath)) return false;

  const existingMessages = readJson(messagesPath);
  const nextMessages = localizeEqualStrings(
    englishMessages,
    existingMessages,
    spec,
  );
  nextMessages.common = {
    ...nextMessages.common,
    languageName: existingMessages.common?.languageName ?? spec.nativeName,
    languageCode: existingMessages.common?.languageCode ?? spec.locale,
  };
  writeJson(messagesPath, nextMessages);

  const existingPlaceTypes = readJson(placeTypesPath);
  writeJson(
    placeTypesPath,
    localizeEqualStrings(englishPlaceTypes, existingPlaceTypes, spec),
  );
  return true;
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
    const base = truncateLabel(name, maxLength);
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

const regionFiles = (language) => [
  [
    "packages/geoint/region-dist/region-2.json",
    `packages/geoint/region-dist/region-2-${language}.json`,
    36,
  ],
  [
    "packages/geoint/region-dist/region-3.json",
    `packages/geoint/region-dist/region-3-${language}.json`,
    20,
  ],
  [
    "packages/geoint/region-dist/region-2-moon.json",
    `packages/geoint/region-dist/region-2-moon-${language}.json`,
    48,
  ],
  [
    "packages/geoint/region-dist/region-2-mars.json",
    `packages/geoint/region-dist/region-2-mars-${language}.json`,
    48,
  ],
  [
    "packages/geoint/region-dist/region-3-mars.json",
    `packages/geoint/region-dist/region-3-mars-${language}.json`,
    48,
  ],
];

const hasAllRegionFiles = (language) =>
  regionFiles(language).every(([, output]) => pathExists(output));

const appendBefore = (source, marker, lines, sectionStart = "") => {
  const startIndex = sectionStart ? source.indexOf(sectionStart) : 0;
  if (startIndex === -1)
    throw new Error(`section start not found: ${sectionStart}`);
  const markerIndex = source.indexOf(marker, startIndex);
  if (markerIndex === -1) throw new Error(`marker not found: ${marker}`);
  const section = source.slice(startIndex, markerIndex);
  const missingLines = lines.filter((line) => !section.includes(line));
  if (!missingLines.length) return source;
  const prefix =
    markerIndex > 0 && source[markerIndex - 1] !== "\n" ? "\n" : "";
  return `${source.slice(0, markerIndex)}${prefix}${missingLines.join(
    "\n",
  )}\n${source.slice(markerIndex)}`;
};

const removeQuotedEntriesFromArray = (source, arrayName, languages) => {
  const pattern = new RegExp(
    `(const ${arrayName} = new Set\\(\\[)([\\s\\S]*?)(\\]\\);)`,
  );
  const match = source.match(pattern);
  if (!match) throw new Error(`${arrayName} not found`);
  const [, head, body, tail] = match;
  const languageSet = new Set(languages);
  const nextBody = body
    .split("\n")
    .filter((line) => {
      const quoted = line.match(/"([^"]+)"/)?.[1];
      return !quoted || !languageSet.has(quoted);
    })
    .join("\n");
  return source.replace(pattern, `${head}${nextBody}${tail}`);
};

const generatedRegions = [];
for (const spec of target.languages) {
  localizeMessages(spec);
  if (spec.language === "english" || hasAllRegionFiles(spec.language)) {
    continue;
  }

  for (const [input, output, maxLength] of regionFiles(spec.language)) {
    writeJson(output, localizedRows(spec, input, maxLength));
  }
  generatedRegions.push(spec.language);
}

if (generatedRegions.length) {
  const regionPath = "packages/ground-codes/src/region.ts";
  let regionSource = readText(regionPath);
  regionSource = appendBefore(
    regionSource,
    "]);\n\nconst englishRegionFallbackLanguages",
    generatedRegions.map((language) => `  "${language}",`),
    "const addressGapLanguages",
  );
  regionSource = removeQuotedEntriesFromArray(
    regionSource,
    "englishRegionFallbackLanguages",
    generatedRegions,
  );
  regionSource = appendBefore(
    regionSource,
    "};\n\nconst loadAddressGapRegionDataset",
    generatedRegions.flatMap((language) => [
      `  "region-2-${language}": async () =>`,
      `    loadRegionData("@ground-codes/geoint/region-dist/region-2-${language}.json"),`,
      `  "region-3-${language}": async () =>`,
      `    loadRegionData("@ground-codes/geoint/region-dist/region-3-${language}.json"),`,
      `  "region-2-moon-${language}": async () =>`,
      `    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-${language}.json"),`,
      `  "region-2-mars-${language}": async () =>`,
      `    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-${language}.json"),`,
      `  "region-3-mars-${language}": async () =>`,
      `    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-${language}.json"),`,
    ]),
    "const addressGapRegionLoaders",
  );
  writeText(regionPath, regionSource);
}

console.log(
  `Localized UI message coverage for ${target.languages.length - 1} locales.`,
);
console.log(
  generatedRegions.length
    ? `Generated localized region scaffolds for ${generatedRegions.length} languages: ${generatedRegions.join(", ")}`
    : "No missing localized region scaffold files.",
);
