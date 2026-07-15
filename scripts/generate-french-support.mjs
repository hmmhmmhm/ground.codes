import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { assertMaterializedRegionData } from "./region-data/materialization.mjs";

import { standaloneWords } from "./data/french-codebook-base.mjs";
import { supplementalStandaloneWords } from "./data/french-codebook-supplemental.mjs";
import {
  additionalSupplementalStandaloneWords,
  finalSupplementalStandaloneWords,
  prefixes,
} from "./data/french-codebook-more.mjs";
import {
  suffixes,
  reviewedFrenchVerbRejects,
  blockedCodebookWords,
} from "./data/french-codebook-policy.mjs";
import {
  earthNameOverridesByCode,
  marineTerms,
  planetaryPhraseOverrides,
  planetaryTerms,
} from "./data/french-regions.mjs";
import { createRequire } from "node:module";
import path from "node:path";

assertMaterializedRegionData();
const root = new URL("../", import.meta.url);
const geointRequire = createRequire(
  new URL("../packages/geoint/", import.meta.url),
);
const { default: KDBush } = await import(geointRequire.resolve("kdbush"));
const { Level } = await import(geointRequire.resolve("level"));

const readJson = (path) =>
  JSON.parse(readFileSync(new URL(path, root), "utf8"));
const writeJson = (path, value) =>
  writeFileSync(new URL(path, root), `${JSON.stringify(value, null, 2)}\n`);

const normalizeAscii = (value) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "Oe")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "Ae")
    .replace(/[’']/g, "")
    .replace(/[-/#?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleWord = (value) => {
  const normalized = normalizeAscii(value).replace(/[^A-Za-z]/g, "");
  if (!normalized) return "";
  return `${normalized[0].toUpperCase()}${normalized.slice(1).toLowerCase()}`;
};

const reviewedStandaloneFiles = [
  "packages/codebook/codebook-dataset/french/standalone-review-2026-05-24.md",
];

const readReviewedStandaloneWords = () => {
  const words = [];

  for (const file of reviewedStandaloneFiles) {
    const text = readFileSync(new URL(file, root), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.push(match[1]);
    }
  }

  return words;
};

const buildFrenchCodebook = () => {
  const words = [];
  const seen = new Set();
  const bip39SeedWords = readJson(
    "packages/codebook/codebook-dataset/french/bip39-normalized-seed.json",
  );

  const add = (word) => {
    const candidate = titleWord(word);
    if (!candidate) return;
    if (!/^[A-Z][a-z]+$/.test(candidate)) return;
    if (candidate.length > 12) return;
    if (blockedCodebookWords.has(candidate)) return;
    if (reviewedFrenchVerbRejects.has(candidate)) return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    words.push(candidate);
  };

  for (const word of standaloneWords) add(word);
  for (const word of readReviewedStandaloneWords()) add(word);
  for (const word of bip39SeedWords) add(word);
  for (const word of supplementalStandaloneWords) add(word);
  for (const word of additionalSupplementalStandaloneWords) add(word);
  for (const word of finalSupplementalStandaloneWords) add(word);

  for (const suffix of suffixes) {
    for (const prefix of prefixes) {
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  if (words.length < 5000) {
    throw new Error(`French codebook generated ${words.length} words`);
  }

  return words.slice(0, 5000);
};

const translateEarthRegionName = (row) => {
  if (earthNameOverridesByCode.has(String(row.code))) {
    return earthNameOverridesByCode.get(String(row.code));
  }
  return normalizeAscii(row.name);
};

const translateRegion3Name = (row) => {
  let name = normalizeAscii(row.name);

  if (name === "Antarctic Continent") {
    return "Antarctique";
  }

  if (row.source === "synthetic-named-gap" && name === "HavreSaint Pierre") {
    return "Havre Pierre";
  }

  if (row.source === "natural-earth-marine") {
    const marineGridMatch = name.match(
      /^(.+) (Sea|Ocean|Bay|Gulf|Channel|Strait|Sound|Basin|Ridge|Plateau|Rise|Trench|Bank) (\d+)$/,
    );
    if (marineGridMatch) {
      const [, base, term, index] = marineGridMatch;
      return normalizeAscii(
        `${marineTerms.get(term) ?? term} ${base} ${index}`,
      );
    }

    for (const [english, french] of marineTerms) {
      name = name.replace(new RegExp(`^${english} `), `${french} `);
      name = name.replace(new RegExp(` ${english} `), ` ${french} `);
      name = name.replace(new RegExp(` ${english}( \\d+)$`), ` ${french}$1`);
    }
  }

  name = name
    .replace(/^Antarctic /, "Antarctique ")
    .replace(/^Arctic /, "Arctique ")
    .replace(/^Sahara /, "Sahara ")
    .replace(/^Greenland /, "Groenland ")
    .replace(/^Desert /, "Desert ")
    .replace(/^Forest /, "Foret ")
    .replace(/^Island /, "Ile ")
    .replace(/^Lake /, "Lac ")
    .replace(/^Mount /, "Mont ")
    .replace(/^River /, "Riviere ")
    .replace(/^Valley /, "Vallee ");

  return normalizeAscii(name);
};

const translatePlanetaryName = (name) => {
  const normalized = normalizeAscii(name);
  if (planetaryPhraseOverrides.has(normalized)) {
    return planetaryPhraseOverrides.get(normalized);
  }

  let translated = normalized;
  for (const [pattern, replacement] of planetaryTerms) {
    translated = translated.replace(pattern, replacement);
  }
  translated = translated.replace(
    /^([A-Za-z]+) Cratere( \d+)?$/,
    "Cratere $1$2",
  );
  return normalizeAscii(translated);
};

const dedupeNames = (rows) => {
  const seen = new Set();
  return rows.map((row) => {
    const baseName = row.name;
    let name = baseName;
    let count = 2;
    while (seen.has(name.toLowerCase())) {
      name = `${baseName} ${count}`;
      count += 1;
    }
    seen.add(name.toLowerCase());
    if (name === row.name) return row;
    return {
      ...row,
      name,
    };
  });
};

const buildLocalizedRows = (sourcePath, targetPath, translateName) => {
  const rows = readJson(sourcePath).map((row) => ({
    ...row,
    name: translateName(row),
  }));
  writeJson(targetPath, dedupeNames(rows));
};

const buildEmbeddedRegionDb = async (regionName) => {
  const regionJsonPath = new URL(
    `packages/geoint/region-dist/${regionName}.json`,
    root,
  );
  const regionDbPath = new URL("packages/geoint/region-db/", root);
  const regionLevelDbPath = path.join(regionDbPath.pathname, regionName);
  const regionKDBushPath = path.join(
    regionDbPath.pathname,
    `${regionName}.index`,
  );
  const regionLevel = Number(regionName.split("-")[1]);
  const regions = JSON.parse(readFileSync(regionJsonPath, "utf8"));

  mkdirSync(regionDbPath, { recursive: true });
  rmSync(regionLevelDbPath, { recursive: true, force: true });
  rmSync(regionKDBushPath, { force: true });

  const kdbush = new KDBush(regions.length);
  const db = new Level(regionLevelDbPath);
  await db.open();

  for (const [index, region] of regions.entries()) {
    await db.put(`I-${index}`, JSON.stringify(region));
    await db.put(
      `N-${regionLevel === 1 ? region.code : region.name}`,
      `I-${index}`,
    );
    kdbush.add(region.long, region.lat);
  }

  kdbush.finish();
  await db.close();
  writeFileSync(regionKDBushPath, Buffer.from(kdbush.data));
};

const mode = process.argv[2] ?? "all";
if (!["all", "codebook-only"].includes(mode)) {
  throw new Error(`Unsupported mode: ${mode}`);
}

writeJson("packages/codebook/codebook-dist/french.json", buildFrenchCodebook());

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-french.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-french.json",
    translateRegion3Name,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-french.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-french.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-french.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-french",
    "region-3-french",
    "region-2-moon-french",
    "region-2-mars-french",
    "region-3-mars-french",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
