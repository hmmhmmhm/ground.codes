import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { buildThaiCodebook } from "./data/thai-codebook-builder.mjs";
import { assertMaterializedRegionData } from "./region-data/materialization.mjs";
import {
  earthNameOverridesByCode,
  knownNameTranslations,
  letterToThai,
  marineTerms,
  planetaryLeadingTerms,
  planetaryPhraseOverrides,
} from "./data/thai-regions.mjs";

assertMaterializedRegionData();
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

const normalizeLatin = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’']/g, "")
    .replace(/[-/#?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const transliterateLatinToken = (token) => {
  if (!token) return "";
  if (/^\d+$/.test(token)) return token;
  if (knownNameTranslations.has(token)) return knownNameTranslations.get(token);

  const lower = token.toLowerCase();
  let output = "";
  for (const character of lower) {
    output += letterToThai.get(character) ?? "";
  }
  return output || "เขต";
};

const transliterateLatinPhrase = (phrase) =>
  normalizeLatin(phrase)
    .split(" ")
    .filter(Boolean)
    .map(transliterateLatinToken)
    .join("");

const transliterateLatinPhraseWithNumericSuffix = (phrase) => {
  const normalized = normalizeLatin(phrase);
  const numbered = normalized.match(/^(.+) (\d+)$/);
  if (!numbered) return transliterateLatinPhrase(normalized);

  const [, base, index] = numbered;
  return `${transliterateLatinPhrase(base)} ${index}`;
};

const translateEarthRegionName = (row) => {
  const override = earthNameOverridesByCode.get(String(row.code));
  if (override) return override;
  if (knownNameTranslations.has(row.name))
    return knownNameTranslations.get(row.name);
  return transliterateLatinPhrase(row.name);
};

const limitName = (name, maxLength = 20) => {
  if (characterLength(name) <= maxLength) return name;
  const numbered = name.match(/^(.+) (\d+)$/);
  if (!numbered) return [...name].slice(0, maxLength).join("").trim();

  const [, base, index] = numbered;
  const maxBaseLength = maxLength - index.length - 1;
  return `${[...base].slice(0, maxBaseLength).join("").trim()} ${index}`;
};

const translateRegion3Name = (row) => {
  let name = normalizeLatin(row.name);

  if (name === "Antarctic Continent") {
    return "แอนตาร์กติกา";
  }

  if (row.source === "natural-earth-marine") {
    const marineGridMatch = name.match(
      /^(.+) (Sea|Ocean|Bay|Gulf|Channel|Strait|Sound|Basin|Ridge|Plateau|Rise|Trench|Bank) (\d+)$/,
    );
    if (marineGridMatch) {
      const [, base, term, index] = marineGridMatch;
      const translatedBase = transliterateLatinPhrase(base);
      return limitName(
        `${marineTerms.get(term) ?? "ทะเล"}${translatedBase} ${index}`,
      );
    }
  }

  name = name
    .replace(/^Antarctic /, "แอนตาร์กติก ")
    .replace(/^Arctic /, "อาร์กติก ")
    .replace(/^Sahara /, "ซาฮารา ")
    .replace(/^Greenland /, "กรีนแลนด์ ")
    .replace(/^Desert /, "ทะเลทราย ")
    .replace(/^Forest /, "ป่า ")
    .replace(/^Island /, "เกาะ ")
    .replace(/^Lake /, "ทะเลสาบ ")
    .replace(/^Mount /, "ภูเขา ")
    .replace(/^River /, "แม่น้ำ ")
    .replace(/^Valley /, "หุบเขา ");

  return limitName(transliterateLatinPhraseWithNumericSuffix(name));
};

const translatePlanetaryName = (name) => {
  const normalized = normalizeLatin(name);
  if (planetaryPhraseOverrides.has(normalized)) {
    return planetaryPhraseOverrides.get(normalized);
  }

  const craterMatch = normalized.match(/^(.+) Crater( \d+)?$/);
  if (craterMatch) {
    const [, base, index = ""] = craterMatch;
    return `หลุมอุกกาบาต${transliterateLatinPhrase(base)}${index}`;
  }

  for (const [latinTerm, thaiTerm] of planetaryLeadingTerms) {
    if (normalized.startsWith(`${latinTerm} `)) {
      return `${thaiTerm}${transliterateLatinPhrase(normalized.slice(latinTerm.length + 1))}`;
    }
  }

  for (const [latinTerm, thaiTerm] of planetaryLeadingTerms) {
    if (normalized.endsWith(` ${latinTerm}`)) {
      return `${thaiTerm}${transliterateLatinPhrase(normalized.slice(0, -latinTerm.length - 1))}`;
    }
  }

  return transliterateLatinPhrase(normalized);
};

const dedupeNames = (rows) => {
  const seen = new Set();
  return rows.map((row) => {
    const baseName = row.name;
    let name = baseName;
    let count = 2;
    while (seen.has(name.toLowerCase())) {
      const suffix = ` ${count}`;
      name = `${[...baseName]
        .slice(0, 20 - suffix.length)
        .join("")
        .trim()}${suffix}`;
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

const addLookupKeys = (keys, row) => {
  keys.add(String(row.name ?? "").toLowerCase());
  keys.add(String(row.code ?? "").toLowerCase());
};

const avoidNamedGapLookupCollisions = (targetPath, reservedPaths) => {
  const rows = readJson(targetPath);
  const lookupKeys = new Set();

  for (const reservedPath of reservedPaths) {
    for (const row of readJson(reservedPath)) {
      addLookupKeys(lookupKeys, row);
    }
  }

  for (const row of rows) {
    if (row.source !== "synthetic-named-gap") {
      addLookupKeys(lookupKeys, row);
    }
  }

  const localizedRows = rows.map((row) => {
    if (row.source !== "synthetic-named-gap") {
      return row;
    }

    const baseName = row.name;
    let name = baseName;
    let count = 2;
    while (lookupKeys.has(name.toLowerCase())) {
      const suffix = ` ${count}`;
      name = `${[...baseName]
        .slice(0, 20 - suffix.length)
        .join("")
        .trim()}${suffix}`;
      count += 1;
    }
    lookupKeys.add(name.toLowerCase());

    if (name === row.name) {
      return row;
    }
    return {
      ...row,
      name,
    };
  });

  writeJson(targetPath, localizedRows);
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

writeJson("packages/codebook/codebook-dist/thai.json", buildThaiCodebook());

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-thai.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-thai.json",
    translateRegion3Name,
  );
  avoidNamedGapLookupCollisions(
    "packages/geoint/region-dist/region-3-thai.json",
    [
      "packages/geoint/region-dist/region-1.json",
      "packages/geoint/region-dist/region-2-thai.json",
    ],
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-thai.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-thai.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-thai.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-thai",
    "region-3-thai",
    "region-2-moon-thai",
    "region-2-mars-thai",
    "region-3-mars-thai",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
