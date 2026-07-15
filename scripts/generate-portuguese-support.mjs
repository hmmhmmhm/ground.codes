import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { assertMaterializedRegionData } from "./region-data/materialization.mjs";

import {
  standaloneWords,
  prefixes,
  naturalCompoundSuffixes,
  suffixes,
  blockedCodebookWords,
} from "./data/portuguese-codebook.mjs";
import {
  earthNameOverridesByCode,
  marineTerms,
  planetaryPhraseOverrides,
  planetaryTerms,
} from "./data/portuguese-regions.mjs";
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
  String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
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
  "packages/codebook/codebook-dataset/portuguese/standalone-review-2026-05-24.md",
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

const isAwkwardPortugueseCompound = (word) => {
  const lower = word.toLowerCase();
  if (lower.length % 2 === 0) {
    const half = lower.slice(0, lower.length / 2);
    if (half.length >= 4 && lower === `${half}${half}`) return true;
  }

  return /^(?:Acucar|Agua|Areia|Barro|Lama|Rio|Riacho)(?:banco|fita|folha|lona|livro|mesa|pano|selo)$|^(?:Arvore|Folha|Luz)branco$/u.test(
    word,
  );
};

const buildPortugueseCodebook = () => {
  const words = [];
  const seen = new Set();

  const add = (word) => {
    const candidate = titleWord(word);
    if (!candidate) return;
    if (!/^[A-Z][a-z]+$/.test(candidate)) return;
    if (candidate.length > 12) return;
    if (blockedCodebookWords.has(candidate)) return;
    if (isAwkwardPortugueseCompound(candidate)) return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    words.push(candidate);
  };

  for (const word of standaloneWords) add(word);
  for (const word of readReviewedStandaloneWords()) add(word);

  for (const suffix of naturalCompoundSuffixes) {
    for (const prefix of prefixes) {
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  for (const suffix of suffixes) {
    for (const prefix of prefixes) {
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  if (words.length < 5000) {
    throw new Error(`Portuguese codebook generated ${words.length} words`);
  }

  return words.slice(0, 5000);
};

const translateEarthRegionName = (row) => {
  if (earthNameOverridesByCode.has(String(row.code))) {
    return earthNameOverridesByCode.get(String(row.code));
  }
  return normalizeAscii(row.name);
};

const limitRegion3Name = (name) => {
  if ([...name].length <= 20) return name;
  const numbered = name.match(/^(.+) (\d+)$/);
  if (!numbered) return name.slice(0, 20).trim();

  const [, base, index] = numbered;
  const maxBaseLength = 20 - index.length - 1;
  return `${base.slice(0, maxBaseLength).trim()} ${index}`;
};

const translateRegion3Name = (row) => {
  let name = normalizeAscii(row.name);

  if (name === "Antarctic Continent") {
    return "Antartida";
  }

  if (row.source === "natural-earth-marine") {
    const marineGridMatch = name.match(
      /^(.+) (Sea|Ocean|Bay|Gulf|Channel|Strait|Sound|Basin|Ridge|Plateau|Rise|Trench|Bank) (\d+)$/,
    );
    if (marineGridMatch) {
      const [, base, term, index] = marineGridMatch;
      if (term === "Sea" && /^[A-Z][A-Za-z]+$/.test(base)) {
        return limitRegion3Name(normalizeAscii(`Mar de ${base} ${index}`));
      }
      return limitRegion3Name(
        normalizeAscii(`${marineTerms.get(term) ?? term} ${base} ${index}`),
      );
    }

    for (const [english, portuguese] of marineTerms) {
      name = name.replace(new RegExp(`^${english} `), `${portuguese} `);
      name = name.replace(new RegExp(` ${english} `), ` ${portuguese} `);
      name = name.replace(
        new RegExp(` ${english}( \\d+)$`),
        ` ${portuguese}$1`,
      );
    }
  }

  name = name
    .replace(/^Antarctic /, "Antartico ")
    .replace(/^Arctic /, "Artico ")
    .replace(/^Sahara /, "Saara ")
    .replace(/^Greenland /, "Groenlandia ")
    .replace(/^Desert /, "Deserto ")
    .replace(/^Forest /, "Floresta ")
    .replace(/^Island /, "Ilha ")
    .replace(/^Lake /, "Lago ")
    .replace(/^Mount /, "Monte ")
    .replace(/^River /, "Rio ")
    .replace(/^Valley /, "Vale ");

  return limitRegion3Name(normalizeAscii(name));
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
    /^([A-Za-z]+) Cratera( \d+)?$/,
    "Cratera $1$2",
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
      name = `${baseName.slice(0, 20 - suffix.length).trim()}${suffix}`;
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

writeJson(
  "packages/codebook/codebook-dist/portuguese.json",
  buildPortugueseCodebook(),
);

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-portuguese.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-portuguese.json",
    translateRegion3Name,
  );
  avoidNamedGapLookupCollisions(
    "packages/geoint/region-dist/region-3-portuguese.json",
    [
      "packages/geoint/region-dist/region-1.json",
      "packages/geoint/region-dist/region-2-portuguese.json",
    ],
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-portuguese.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-portuguese.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-portuguese.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-portuguese",
    "region-3-portuguese",
    "region-2-moon-portuguese",
    "region-2-mars-portuguese",
    "region-3-mars-portuguese",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
