import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import {
  russianWordPattern,
  blockedTokens,
} from "./data/russian-codebook-policy.mjs";
import { standaloneWords } from "./data/russian-codebook-standalone.mjs";
import { reviewedStandaloneWordsV3 } from "./data/russian-codebook-reviewed-v3.mjs";
import { reviewedStandaloneWordsV4 } from "./data/russian-codebook-reviewed-v4.mjs";
import {
  reviewedStandaloneWordsV5,
  reviewedStandaloneWordsV6,
} from "./data/russian-codebook-reviewed-final.mjs";
import {
  compoundPrefixes,
  compoundSuffixes,
} from "./data/russian-codebook-compounds.mjs";
import {
  earthNameOverridesByCode,
  latinPairs,
  latinMap,
  marineTerms,
  marineProperFragments,
  planetaryExactNames,
  planetaryLeadingTerms,
} from "./data/russian-regions.mjs";

import { russianReviewedStandaloneWordsV2Part1 } from "./data/russian-reviewed-standalone-words-v2-1.mjs";
import { russianReviewedStandaloneWordsV2Part2 } from "./data/russian-reviewed-standalone-words-v2-2.mjs";
import { createRequire } from "node:module";
import path from "node:path";

const root = new URL("../", import.meta.url);
const geointRequire = createRequire(
  new URL("../packages/geoint/", import.meta.url),
);
const { default: KDBush } = await import(geointRequire.resolve("kdbush"));
const { Level } = await import(geointRequire.resolve("level"));

const readJson = (filePath) =>
  JSON.parse(readFileSync(new URL(filePath, root), "utf8"));
const writeJson = (filePath, value) =>
  writeFileSync(new URL(filePath, root), `${JSON.stringify(value, null, 2)}\n`);

const reviewedStandaloneWordsV2 = [
  ...russianReviewedStandaloneWordsV2Part1,
  ...russianReviewedStandaloneWordsV2Part2,
];

const addWord = (words, seen, word) => {
  const normalized = word.normalize("NFC").toLowerCase();
  if (!russianWordPattern.test(normalized)) return;
  if ([...normalized].length > 14) return;
  if (blockedTokens.has(normalized)) return;
  if (seen.has(normalized)) return;
  seen.add(normalized);
  words.push(normalized);
};

const buildRussianCodebook = () => {
  const words = [];
  const seen = new Set();

  for (const word of standaloneWords) {
    addWord(words, seen, word);
  }
  for (const word of reviewedStandaloneWordsV2) {
    addWord(words, seen, word);
  }
  for (const word of reviewedStandaloneWordsV3) {
    addWord(words, seen, word);
  }
  for (const word of reviewedStandaloneWordsV4) {
    addWord(words, seen, word);
  }
  for (const word of reviewedStandaloneWordsV5) {
    addWord(words, seen, word);
  }
  for (const word of reviewedStandaloneWordsV6) {
    addWord(words, seen, word);
  }

  for (const prefix of compoundPrefixes) {
    for (const suffix of compoundSuffixes) {
      if (prefix === suffix) continue;
      addWord(words, seen, `${prefix}${suffix}`);
    }
  }

  if (words.length < 5000) {
    throw new Error(`Russian codebook generated ${words.length} words`);
  }

  return words.slice(0, 5000);
};

const removeUnsafeRegionChars = (value) =>
  String(value)
    .replace(/[’'`´/#?\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const titleCyrillic = (value) =>
  value.replace(/\p{Script=Cyrillic}+/gu, (word) => {
    const chars = [...word];
    return `${chars[0].toLocaleUpperCase("ru")}${chars
      .slice(1)
      .join("")
      .toLocaleLowerCase("ru")}`;
  });

const transliterateLatinWord = (word) => {
  let value = removeUnsafeRegionChars(word)
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "");
  for (const [pattern, replacement] of latinPairs) {
    value = value.replace(pattern, replacement);
  }

  let output = "";
  for (const char of value) {
    if (/\d/.test(char)) {
      output += char;
      continue;
    }
    if (/\s/.test(char)) {
      output += " ";
      continue;
    }
    if (/[\p{Script=Cyrillic}\p{Mark}]/u.test(char)) {
      output += char;
      continue;
    }
    const mapped = latinMap.get(char.toLowerCase());
    if (mapped) output += mapped;
  }
  return titleCyrillic(output.replace(/\s+/g, " ").trim());
};

const translateEarthRegionName = (row) =>
  earthNameOverridesByCode.get(String(row.code)) ??
  transliterateLatinWord(row.name);

const translateMarineProper = (value) => {
  let name = value;
  for (const [english, russian] of marineProperFragments) {
    name = name.replace(new RegExp(`\\b${english}\\b`, "g"), russian);
  }
  return transliterateLatinWord(name);
};

const translateRegion3Name = (row) => {
  let name = removeUnsafeRegionChars(row.name);
  if (row.source === "synthetic-antarctic-grid") {
    return name.replace(/^Antarctic Grid/, "Антарктика");
  }
  if (row.source === "synthetic-arctic-grid") {
    return name.replace(/^Arctic Grid/, "Арктика");
  }
  if (row.source === "synthetic-sahara-grid") {
    return name.replace(/^Sahara Grid/, "Сахара");
  }
  if (row.source === "synthetic-named-gap") {
    return transliterateLatinWord(name.replace(/^Gap/, "Участок"));
  }

  for (const [english, russian] of marineTerms) {
    const trailingMatch = name.match(new RegExp(`^(.+) ${english} (\\d+)$`));
    if (trailingMatch) {
      return `${russian} ${translateMarineProper(trailingMatch[1])} ${trailingMatch[2]}`;
    }
    name = name.replace(new RegExp(`^${english} `), `${russian} `);
    name = name.replace(new RegExp(` ${english} `), ` ${russian} `);
    name = name.replace(new RegExp(` ${english}( \\d+)$`), ` ${russian}$1`);
  }
  return transliterateLatinWord(name);
};

const translatePlanetaryName = (value) => {
  const name = removeUnsafeRegionChars(value);
  const exact = planetaryExactNames.get(name);
  if (exact) return exact;

  const numberedCrater = name.match(/^(.+) Crater (\d+)$/);
  if (numberedCrater) {
    return `кратер ${transliterateLatinWord(numberedCrater[1])} ${numberedCrater[2]}`;
  }

  for (const [english, russian] of planetaryLeadingTerms) {
    if (name.startsWith(`${english} `)) {
      return `${russian} ${transliterateLatinWord(name.slice(english.length + 1))}`;
    }
    if (name.endsWith(` ${english}`)) {
      return `${russian} ${transliterateLatinWord(name.slice(0, -english.length - 1))}`;
    }
  }
  return transliterateLatinWord(name);
};

const truncateCodePoints = (value, maxLength) =>
  [...value].slice(0, maxLength).join("");

const dedupeNames = (rows, maxLength) => {
  const seenKeys = new Set();
  const baseCounts = new Map();
  return rows.map((row) => {
    const base = maxLength ? truncateCodePoints(row.name, maxLength) : row.name;
    const key = base.toLocaleLowerCase("ru");
    const nextCount = baseCounts.get(key) ?? 0;
    baseCounts.set(key, nextCount + 1);

    let candidate = base;
    let suffixIndex = nextCount + 1;
    while (seenKeys.has(candidate.toLocaleLowerCase("ru"))) {
      const suffix = `${suffixIndex++}`;
      candidate = maxLength
        ? `${truncateCodePoints(base, Math.max(1, maxLength - suffix.length))}${suffix}`
        : `${base}${suffix}`;
    }

    seenKeys.add(candidate.toLocaleLowerCase("ru"));
    return { ...row, name: candidate };
  });
};

const buildLocalizedRows = (
  inputPath,
  outputPath,
  translateName,
  maxLength,
) => {
  const rows = readJson(inputPath).map((row) => ({
    ...row,
    name: translateName(row),
  }));
  writeJson(outputPath, dedupeNames(rows, maxLength));
};

const buildEmbeddedRegionDb = async (regionName) => {
  const regions = readJson(`packages/geoint/region-dist/${regionName}.json`);
  const regionDbPath = new URL("packages/geoint/region-db/", root);
  const regionLevelDbPath = path.join(regionDbPath.pathname, regionName);
  const indexPath = path.join(regionDbPath.pathname, `${regionName}.index`);

  rmSync(regionLevelDbPath, { recursive: true, force: true });
  rmSync(indexPath, { force: true });
  mkdirSync(regionLevelDbPath, { recursive: true });

  const db = new Level(regionLevelDbPath);
  const index = new KDBush(regions.length);

  for (const [indexKey, region] of regions.entries()) {
    index.add(region.long, region.lat);
    await db.put(`I-${indexKey}`, JSON.stringify(region));
    await db.put(`N-${region.name}`, `I-${indexKey}`);
  }

  index.finish();
  writeFileSync(indexPath, Buffer.from(index.data));
  await db.close();
};

writeJson(
  "packages/codebook/codebook-dist/russian.json",
  buildRussianCodebook(),
);

buildLocalizedRows(
  "packages/geoint/region-dist/region-2.json",
  "packages/geoint/region-dist/region-2-russian.json",
  translateEarthRegionName,
  32,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-3.json",
  "packages/geoint/region-dist/region-3-russian.json",
  translateRegion3Name,
  20,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-2-moon.json",
  "packages/geoint/region-dist/region-2-moon-russian.json",
  ({ name }) => translatePlanetaryName(name),
  48,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-2-mars.json",
  "packages/geoint/region-dist/region-2-mars-russian.json",
  ({ name }) => translatePlanetaryName(name),
  48,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-3-mars.json",
  "packages/geoint/region-dist/region-3-mars-russian.json",
  ({ name }) => translatePlanetaryName(name),
  48,
);

for (const regionName of [
  "region-2-russian",
  "region-3-russian",
  "region-2-moon-russian",
  "region-2-mars-russian",
  "region-3-mars-russian",
]) {
  await buildEmbeddedRegionDb(regionName);
}
