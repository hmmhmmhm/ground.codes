import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import {
  latinWordPattern,
  blockedTokens,
  awkwardVietnameseGeneratedCompounds,
} from "./data/vietnamese-codebook-policy.mjs";
import {
  objectRoots,
  materialSuffixes,
  containerRoots,
  contentSuffixes,
  plantRoots,
  plantSuffixes,
  placeRoots,
  placeSuffixes,
  builtPlaceRoots,
  builtPlaceSuffixes,
  waterPlaceRoots,
  waterPlaceSuffixes,
  gardenPlaceRoots,
  gardenPlaceSuffixes,
  terrainPlaceRoots,
  terrainPlaceSuffixes,
} from "./data/vietnamese-codebook-parts-a.mjs";
import {
  foodPairs,
  colorRoots,
  colorSuffixes,
  decoratedObjectRoots,
  motifSuffixes,
  natureRoots,
  natureSuffixes,
  skyNatureRoots,
  skyNatureSuffixes,
  waterNatureRoots,
  waterNatureSuffixes,
  fieldNatureRoots,
  fieldNatureSuffixes,
  animalRoots,
  animalSuffixes,
  transportRoots,
  transportSuffixes,
  patternRoots,
  craftColorRoots,
  commonNounRoots,
  commonNounSuffixes,
  shopRoots,
  shopSuffixes,
} from "./data/vietnamese-codebook-parts-b.mjs";
import {
  laneRoots,
  laneSuffixes,
  roomRoots,
  roomSuffixes,
  craftPlaceRoots,
  craftPlaceSuffixes,
  foodColorRoots,
  foodColorSuffixes,
  freshPlantSuffixes,
  tidyObjectRoots,
  tidyObjectSuffixes,
  softObjectRoots,
  softObjectSuffixes,
  pairedCompounds,
} from "./data/vietnamese-codebook-parts-c.mjs";
import {
  vietnameseRegionOverrides,
  marineTerms,
  planetaryExactNames,
  planetaryLeadingTerms,
} from "./data/vietnamese-regions.mjs";

import { vietnameseStandaloneWordsPart1 } from "./data/vietnamese-standalone-words-1.mjs";
import { vietnameseStandaloneWordsPart2 } from "./data/vietnamese-standalone-words-2.mjs";
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

const standaloneWords = [
  ...vietnameseStandaloneWordsPart1,
  ...vietnameseStandaloneWordsPart2,
];

const normalizeToken = (value) =>
  value
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s\-/#?']/gu, "");

const addToken = (tokens, value) => {
  const token = normalizeToken(value);
  if (!token) return;
  if (blockedTokens.has(token)) return;
  if (awkwardVietnameseGeneratedCompounds.has(token)) return;
  if ([...token].length > 14) return;
  if (!latinWordPattern.test(token)) return;
  if (token.length % 2 === 0) {
    const half = token.slice(0, token.length / 2);
    if (half.length >= 3 && token === `${half}${half}`) return;
  }
  tokens.add(token);
};

const buildVietnameseCodebook = () => {
  const tokens = new Set();
  const addPairGroup = (leftItems, rightItems) => {
    for (const left of leftItems) {
      for (const right of rightItems) {
        if (left === right) continue;
        addToken(tokens, `${left}${right}`);
      }
    }
  };

  for (const word of standaloneWords) addToken(tokens, word);
  for (const [left, right] of pairedCompounds)
    addToken(tokens, `${left}${right}`);

  addPairGroup(objectRoots, materialSuffixes);
  addPairGroup(containerRoots, contentSuffixes);
  addPairGroup(containerRoots, materialSuffixes);
  addPairGroup(plantRoots, plantSuffixes);
  addPairGroup(plantRoots, colorSuffixes);
  addPairGroup(builtPlaceRoots, builtPlaceSuffixes);
  addPairGroup(waterPlaceRoots, waterPlaceSuffixes);
  addPairGroup(gardenPlaceRoots, gardenPlaceSuffixes);
  addPairGroup(terrainPlaceRoots, terrainPlaceSuffixes);
  addPairGroup(colorRoots, colorSuffixes);
  addPairGroup(objectRoots, motifSuffixes);
  addPairGroup(containerRoots, motifSuffixes);
  addPairGroup(plantRoots, natureSuffixes);
  addPairGroup(tidyObjectRoots, tidyObjectSuffixes);
  addPairGroup(softObjectRoots, softObjectSuffixes);
  addPairGroup(decoratedObjectRoots, motifSuffixes);
  addPairGroup(patternRoots, motifSuffixes);
  addPairGroup(patternRoots, materialSuffixes);
  addPairGroup(craftColorRoots, colorSuffixes);
  addPairGroup(commonNounRoots, commonNounSuffixes);
  addPairGroup(commonNounRoots, colorSuffixes);
  addPairGroup(shopRoots, shopSuffixes);
  addPairGroup(laneRoots, laneSuffixes);
  addPairGroup(roomRoots, roomSuffixes);
  addPairGroup(craftPlaceRoots, craftPlaceSuffixes);
  addPairGroup(placeRoots, commonNounSuffixes);
  addPairGroup(plantSuffixes, colorSuffixes);
  addPairGroup(plantSuffixes, freshPlantSuffixes);
  addPairGroup(foodColorRoots, foodColorSuffixes);
  addPairGroup(animalRoots, colorSuffixes);
  addPairGroup(transportRoots, colorSuffixes);
  addPairGroup(skyNatureRoots, colorSuffixes);
  addPairGroup(waterNatureRoots, colorSuffixes);
  addPairGroup(skyNatureRoots, skyNatureSuffixes);
  addPairGroup(waterNatureRoots, waterNatureSuffixes);
  addPairGroup(fieldNatureRoots, fieldNatureSuffixes);
  addPairGroup(animalRoots, animalSuffixes);
  addPairGroup(transportRoots, transportSuffixes);

  for (const [left, rightItems] of foodPairs) {
    addPairGroup([left], rightItems);
  }

  const words = [...tokens].slice(0, 5000);
  if (words.length !== 5000) {
    throw new Error(`Vietnamese codebook has ${words.length} entries`);
  }
  return words;
};

const removeUnsafeRegionChars = (value) =>
  value
    .replace(/[-/#?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncateCodePoints = (value, maxLength) =>
  [...value].slice(0, maxLength).join("").trim();

const dedupeNames = (rows, maxLength = Infinity) => {
  const seen = new Map();
  return rows.map((row) => {
    const base = truncateCodePoints(
      removeUnsafeRegionChars(row.name),
      maxLength,
    );
    const key = base.toLocaleLowerCase("vi");
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count === 0) return { ...row, name: base };

    const suffix = ` ${count + 1}`;
    const name = `${truncateCodePoints(base, maxLength - suffix.length)}${suffix}`;
    return { ...row, name };
  });
};

const translateEarthRegionName = (row) =>
  vietnameseRegionOverrides.get(String(row.code)) ??
  removeUnsafeRegionChars(row.name);

const translateRegion3Name = (row) => {
  let name = removeUnsafeRegionChars(row.name);
  if (row.source === "synthetic-antarctic-grid") {
    return name.replace(/^Antarctic Grid/, "Lưới Nam Cực");
  }
  if (row.source === "synthetic-arctic-grid") {
    return name.replace(/^Arctic Grid/, "Lưới Bắc Cực");
  }
  if (row.source === "synthetic-sahara-grid") {
    return name.replace(/^Sahara Grid/, "Lưới Sahara");
  }
  if (row.source === "synthetic-named-gap") {
    return name.replace(/^Gap/, "Vùng");
  }

  for (const [english, vietnamese] of marineTerms) {
    const trailingMatch = name.match(new RegExp(`^(.+) ${english} (\\d+)$`));
    if (trailingMatch) {
      name = `${vietnamese} ${trailingMatch[1]} ${trailingMatch[2]}`;
      continue;
    }
    name = name.replace(new RegExp(`^${english} `), `${vietnamese} `);
    name = name.replace(new RegExp(` ${english} `), ` ${vietnamese} `);
    name = name.replace(new RegExp(` ${english}( \\d+)$`), ` ${vietnamese}$1`);
  }
  return name;
};

const translatePlanetaryName = (name) => {
  const normalized = removeUnsafeRegionChars(name);
  const exact = planetaryExactNames.get(normalized);
  if (exact) return exact;

  const numberedCrater = normalized.match(/^(.+) Crater (\d+)$/);
  if (numberedCrater) {
    return `Hố va chạm ${numberedCrater[1]} ${numberedCrater[2]}`;
  }

  for (const [english, vietnamese] of planetaryLeadingTerms) {
    if (normalized.startsWith(`${english} `)) {
      return `${vietnamese} ${normalized.slice(english.length + 1)}`;
    }
    if (normalized.endsWith(` ${english}`)) {
      return `${vietnamese} ${normalized.slice(0, -english.length - 1)}`;
    }
  }
  return normalized;
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

const avoidNamedGapLookupCollisions = (region3Path, lookupPaths) => {
  const rows = readJson(region3Path);
  const existingNames = new Set();

  for (const lookupPath of lookupPaths) {
    for (const row of readJson(lookupPath)) {
      existingNames.add(String(row.name ?? "").toLocaleLowerCase("vi"));
      existingNames.add(String(row.code ?? "").toLocaleLowerCase("vi"));
    }
  }

  for (const row of rows) {
    if (row.source !== "synthetic-named-gap") {
      existingNames.add(String(row.name ?? "").toLocaleLowerCase("vi"));
    }
  }

  let index = 1;
  for (const row of rows) {
    if (row.source !== "synthetic-named-gap") continue;
    while (existingNames.has(String(row.name).toLocaleLowerCase("vi"))) {
      row.name = truncateCodePoints(`Vùng trống ${index++}`, 20);
    }
    existingNames.add(String(row.name).toLocaleLowerCase("vi"));
  }

  writeJson(region3Path, rows);
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

writeJson(
  "packages/codebook/codebook-dist/vietnamese.json",
  buildVietnameseCodebook(),
);

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-vietnamese.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-vietnamese.json",
    translateRegion3Name,
    20,
  );
  avoidNamedGapLookupCollisions(
    "packages/geoint/region-dist/region-3-vietnamese.json",
    [
      "packages/geoint/region-dist/region-1.json",
      "packages/geoint/region-dist/region-2-vietnamese.json",
    ],
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-vietnamese.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-vietnamese.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-vietnamese.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-vietnamese",
    "region-3-vietnamese",
    "region-2-moon-vietnamese",
    "region-2-mars-vietnamese",
    "region-3-mars-vietnamese",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
