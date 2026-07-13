import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import {
  hindiWordPattern,
  blockedTokens,
  standaloneWords,
  v2StandaloneWords,
} from "./data/hindi-codebook-base-a.mjs";
import {
  v3StandaloneWords,
  v4StandaloneWords,
  pairedCompounds,
  objectRoots,
  natureRoots,
  plantRoots,
} from "./data/hindi-codebook-base-b.mjs";
import {
  materialSuffixes,
  objectSuffixes,
  placeSuffixes,
  foodSuffixes,
  colorSuffixes,
  materialRoots,
  materialObjectSuffixes,
  fruitRoots,
  fruitSuffixes,
  vegetableRoots,
  vegetableSuffixes,
  grainRoots,
  grainSuffixes,
} from "./data/hindi-codebook-parts-a.mjs";
import {
  publicPlaceRoots,
  publicPlaceSuffixes,
  descriptorPrefixes,
  descriptorNouns,
} from "./data/hindi-codebook-parts-b.mjs";
import {
  foodDescriptorPairs,
  awkwardObjectPlaceRoots,
  awkwardPlaceObjectRoots,
} from "./data/hindi-codebook-policy.mjs";
import {
  hindiRegionOverrides,
  marineTerms,
  earthTerrainTerms,
  hindiMarineProperFragments,
  planetaryExactNames,
  planetaryLeadingTerms,
  planetaryTerrainTerms,
} from "./data/hindi-regions.mjs";
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

const hasGeneratedPair = (word, roots, suffixes) => {
  for (const root of roots) {
    if (!word.startsWith(root)) continue;
    const suffix = word.slice(root.length);
    if (suffixes.has(suffix)) return true;
  }
  return false;
};

const approvedHindiCompounds = new Set(
  pairedCompounds.map(([left, right]) => `${left}${right}`),
);

const isAwkwardGeneratedHindiToken = (token) => {
  if (approvedHindiCompounds.has(token)) return false;

  if (
    hasGeneratedPair(token, awkwardObjectPlaceRoots, new Set(materialSuffixes))
  ) {
    return true;
  }
  if (
    hasGeneratedPair(token, awkwardObjectPlaceRoots, new Set(placeSuffixes))
  ) {
    return true;
  }
  if (
    hasGeneratedPair(token, awkwardPlaceObjectRoots, new Set(objectSuffixes))
  ) {
    return true;
  }
  if (
    hasGeneratedPair(token, awkwardObjectPlaceRoots, new Set(objectSuffixes))
  ) {
    return true;
  }

  return false;
};

const addToken = (tokens, value) => {
  const token = value.normalize("NFC").replace(/[\s\-/#?']/gu, "");
  if (!token) return;
  if (blockedTokens.has(token)) return;
  if (isAwkwardGeneratedHindiToken(token)) return;
  if ([...token].length > 14) return;
  if (!hindiWordPattern.test(token)) return;
  tokens.add(token);
};

const buildHindiCodebook = () => {
  const tokens = new Set();
  const addPairs = (leftItems, rightItems) => {
    for (const left of leftItems) {
      for (const right of rightItems) {
        if (left === right) continue;
        addToken(tokens, `${left}${right}`);
      }
    }
  };

  for (const word of standaloneWords) addToken(tokens, word);
  for (const word of v2StandaloneWords) addToken(tokens, word);
  for (const word of v3StandaloneWords) addToken(tokens, word);
  for (const word of v4StandaloneWords) addToken(tokens, word);
  for (const [left, right] of pairedCompounds)
    addToken(tokens, `${left}${right}`);

  addPairs(natureRoots, placeSuffixes);
  addPairs(natureRoots, colorSuffixes);
  addPairs(plantRoots, objectSuffixes);
  addPairs(plantRoots, placeSuffixes);
  addPairs(plantRoots, colorSuffixes);
  addPairs(plantRoots, foodSuffixes);
  addPairs(colorSuffixes, objectSuffixes);
  addPairs(colorSuffixes, plantRoots);
  addPairs(colorSuffixes, natureRoots);
  addPairs(materialRoots, materialObjectSuffixes);
  addPairs(fruitRoots, fruitSuffixes);
  addPairs(vegetableRoots, vegetableSuffixes);
  addPairs(grainRoots, grainSuffixes);
  addPairs(publicPlaceRoots, publicPlaceSuffixes);
  addPairs(descriptorPrefixes, descriptorNouns);
  for (const [prefix, nouns] of foodDescriptorPairs) {
    addPairs([prefix], nouns);
  }

  const words = [...tokens].slice(0, 5000);
  if (words.length !== 5000) {
    throw new Error(`Hindi codebook has ${words.length} entries`);
  }
  return words;
};

const removeUnsafeRegionChars = (value) =>
  String(value)
    .replace(/[’'`´/#?\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const translateEarthRegionName = (row) =>
  hindiRegionOverrides.get(String(row.code)) ??
  removeUnsafeRegionChars(row.name);

const applyEarthTerrainTerms = (value) => {
  let name = value;
  for (const [english, hindi] of earthTerrainTerms) {
    name = name.replace(new RegExp(`\\b${english}\\b`, "g"), hindi);
  }
  return name;
};

const translateHindiMarineProper = (value) => {
  let name = value;
  for (const [english, hindi] of hindiMarineProperFragments) {
    name = name.replace(new RegExp(`\\b${english}\\b`, "g"), hindi);
  }
  return name;
};

const translateRegion3Name = (row) => {
  let name = removeUnsafeRegionChars(row.name);
  if (row.source === "synthetic-antarctic-grid") {
    return applyEarthTerrainTerms(
      name.replace(/^Antarctic Grid/, "दक्षिणग्रिड"),
    );
  }
  if (row.source === "synthetic-arctic-grid") {
    return applyEarthTerrainTerms(name.replace(/^Arctic Grid/, "उत्तरग्रिड"));
  }
  if (row.source === "synthetic-sahara-grid") {
    return applyEarthTerrainTerms(name.replace(/^Sahara Grid/, "सहारा ग्रिड"));
  }
  if (row.source === "synthetic-named-gap") {
    return applyEarthTerrainTerms(name.replace(/^Gap/, "क्षेत्र"));
  }

  for (const [english, hindi] of marineTerms) {
    const trailingMatch = name.match(new RegExp(`^(.+) ${english} (\\d+)$`));
    if (trailingMatch) {
      name = `${translateHindiMarineProper(trailingMatch[1])} ${hindi} ${trailingMatch[2]}`;
      continue;
    }
    name = name.replace(new RegExp(`^${english} `), `${hindi} `);
    name = name.replace(new RegExp(` ${english} `), ` ${hindi} `);
    name = name.replace(new RegExp(` ${english}( \\d+)$`), ` ${hindi}$1`);
  }
  return applyEarthTerrainTerms(name);
};

const translatePlanetaryName = (value) => {
  let name = removeUnsafeRegionChars(value);
  const exact = planetaryExactNames.get(name);
  if (exact) return exact;

  const numberedCrater = name.match(/^(.+) Crater (\d+)$/);
  if (numberedCrater) {
    return `गड्ढा ${numberedCrater[1]} ${numberedCrater[2]}`;
  }

  for (const [english, hindi] of planetaryLeadingTerms) {
    if (name.startsWith(`${english} `)) {
      return `${hindi} ${name.slice(english.length + 1)}`;
    }
    if (name.endsWith(` ${english}`)) {
      return `${hindi} ${name.slice(0, -english.length - 1)}`;
    }
  }
  for (const [english, hindi] of planetaryTerrainTerms) {
    name = name.replace(new RegExp(`\\b${english}\\b`, "g"), hindi);
  }
  return name;
};

const truncateCodePoints = (value, maxLength) =>
  [...value].slice(0, maxLength).join("");

const dedupeNames = (rows, maxLength) => {
  const seenKeys = new Set();
  const baseCounts = new Map();
  return rows.map((row) => {
    const base = maxLength ? truncateCodePoints(row.name, maxLength) : row.name;
    const key = base.toLocaleLowerCase("hi");
    const nextCount = baseCounts.get(key) ?? 0;
    baseCounts.set(key, nextCount + 1);

    let candidate = base;
    let suffixIndex = nextCount + 1;
    while (seenKeys.has(candidate.toLocaleLowerCase("hi"))) {
      const suffix = `${suffixIndex++}`;
      candidate = maxLength
        ? `${truncateCodePoints(base, Math.max(1, maxLength - suffix.length))}${suffix}`
        : `${base}${suffix}`;
    }

    seenKeys.add(candidate.toLocaleLowerCase("hi"));
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
  const regionKDBushPath = path.join(
    regionDbPath.pathname,
    `${regionName}.index`,
  );

  mkdirSync(regionDbPath, { recursive: true });
  rmSync(regionLevelDbPath, { recursive: true, force: true });
  rmSync(regionKDBushPath, { force: true });

  const kdbush = new KDBush(regions.length);
  const db = new Level(regionLevelDbPath);
  await db.open();

  for (const [index, region] of regions.entries()) {
    await db.put(`I-${index}`, JSON.stringify(region));
    await db.put(`N-${region.name}`, `I-${index}`);
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

writeJson("packages/codebook/codebook-dist/hindi.json", buildHindiCodebook());

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-hindi.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-hindi.json",
    translateRegion3Name,
    20,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-hindi.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-hindi.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-hindi.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-hindi",
    "region-3-hindi",
    "region-2-moon-hindi",
    "region-2-mars-hindi",
    "region-3-mars-hindi",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
