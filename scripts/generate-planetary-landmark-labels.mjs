import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { missionFallbacks } from "./data/planetary-mission-fallbacks.mjs";
import { manualLabelOverrides } from "./data/planetary-label-overrides.mjs";

const root = new URL("..", import.meta.url).pathname;

const readText = (relativePath) =>
  readFileSync(join(root, relativePath), "utf8");

const stripNumberSuffix = (value) => value.replace(/\s*\d+$/, "");

const localeLanguageSource = readText(
  "apps/web/lib/i18n/ground-code-language.ts",
);
const languages = [
  "english",
  ...Array.from(
    localeLanguageSource.matchAll(
      /if \(locale === "[^"]+"\) return "([^"]+)";/g,
    ),
    (match) => match[1],
  ),
].filter((language, index, all) => all.indexOf(language) === index);

const targets = {
  moon: [
    { id: "mare-imbrium", level: 2, matchName: "Mare Imbrium" },
    { id: "oceanus-procellarum", level: 2, matchName: "Oceanus Procellarum" },
    { id: "mare-tranquillitatis", level: 2, matchName: "Mare Tranquillitatis" },
    { id: "mare-serenitatis", level: 2, matchName: "Mare Serenitatis" },
    { id: "mare-crisium", level: 2, matchName: "Mare Crisium" },
    { id: "tycho", level: 2, matchName: "Tycho" },
    { id: "copernicus", level: 2, matchName: "Copernicus" },
    { id: "aristarchus", level: 2, matchName: "Aristarchus" },
    { id: "clavius", level: 2, matchName: "Clavius" },
    { id: "shackleton", level: 2, matchName: "Shackleton" },
    { id: "mare-smythii", level: 2, matchName: "Mare Smythii" },
    { id: "mare-marginis", level: 2, matchName: "Mare Marginis" },
    { id: "mare-moscoviense", level: 2, matchName: "Mare Moscoviense" },
    { id: "mare-ingenii", level: 2, matchName: "Mare Ingenii" },
    { id: "mare-australe", level: 2, matchName: "Mare Australe" },
    { id: "tsiolkovskiy", level: 2, matchName: "Tsiolkovskiy" },
    { id: "korolev", level: 2, matchName: "Korolev" },
    { id: "von-karman", level: 2, matchName: "Von Karman" },
    { id: "mendeleev", level: 2, matchName: "Mendeleev" },
    { id: "giordano-bruno", level: 2, matchName: "Giordano Bruno" },
    { id: "mare-orientale", level: 2, matchName: "Mare Orientale" },
    { id: "hertzsprung", level: 2, matchName: "Hertzsprung" },
  ],
  mars: [
    { id: "olympus-mons", level: 2, matchName: "Olympus Mons" },
    { id: "valles-marineris", level: 2, matchName: "Valles Marineris" },
    {
      id: "gale-crater",
      level: 3,
      matchName: "Gale Crater 1",
      normalize: stripNumberSuffix,
    },
    {
      id: "jezero-crater",
      level: 3,
      matchName: "Jezero Crater 2",
      normalize: stripNumberSuffix,
    },
    { id: "hellas-planitia", level: 2, matchName: "Hellas Planitia" },
    { id: "utopia-planitia", level: 2, matchName: "Utopia Planitia" },
    { id: "syrtis-major", level: 2, matchName: "Syrtis Major" },
    { id: "elysium-mons", level: 2, matchName: "Elysium Mons" },
    { id: "tharsis", level: 2, matchName: "Tharsis" },
    { id: "noctis-labyrinthus", level: 2, matchName: "Noctis Labyrinthus" },
    { id: "arsia-mons", level: 2, matchName: "Arsia Mons" },
    { id: "ascraeus-mons", level: 2, matchName: "Ascraeus Mons" },
    { id: "pavonis-mons", level: 2, matchName: "Pavonis Mons" },
    { id: "isidis-planitia", level: 2, matchName: "Isidis Planitia" },
    { id: "arabia-terra", level: 2, matchName: "Arabia Terra" },
    { id: "meridiani-planum", level: 2, matchName: "Meridiani Planum" },
    { id: "chryse-planitia", level: 2, matchName: "Chryse Planitia" },
    { id: "amazonis-planitia", level: 2, matchName: "Amazonis Planitia" },
    { id: "arcadia-planitia", level: 2, matchName: "Arcadia Planitia" },
    { id: "argyre-planitia", level: 2, matchName: "Argyre Planitia" },
    { id: "terra-cimmeria", level: 2, matchName: "Terra Cimmeria" },
  ],
};

const getDatasetPath = (body, level, language) => {
  const suffix = language === "english" ? "" : `-${language}`;
  return `packages/geoint/region-dist/region-${level}-${body}${suffix}.json`;
};

const baseNameIndexCache = new Map();

const getNameIndexes = (body, level) => {
  const key = `${body}:${level}`;
  if (baseNameIndexCache.has(key)) return baseNameIndexCache.get(key);

  const namesByIndex = extractNamesAtIndexes(
    getDatasetPath(body, level, "english"),
    null,
  );
  const indexes = new Map();
  namesByIndex.forEach((name, index) => indexes.set(name, index));
  baseNameIndexCache.set(key, indexes);
  return indexes;
};

const extractNamesAtIndexes = (relativePath, targetIndexes) => {
  const text = readText(relativePath);
  const names = [];
  const remaining =
    targetIndexes === null
      ? null
      : new Set([...targetIndexes].sort((a, b) => a - b));
  const pattern = /"name":\s*"((?:\\.|[^"\\])*)"/g;
  let index = 0;
  let match;

  while ((match = pattern.exec(text))) {
    if (remaining === null || remaining.has(index)) {
      names[index] = JSON.parse(`"${match[1]}"`);
      remaining?.delete(index);
      if (remaining?.size === 0) break;
    }
    index += 1;
  }

  if (remaining?.size) {
    throw new Error(
      `Missing indexes ${[...remaining].join(", ")} in ${relativePath}`,
    );
  }

  return names;
};

const getBaseIndex = (body, level, matchName) => {
  const index = getNameIndexes(body, level).get(matchName);
  if (index === undefined) {
    throw new Error(
      `Missing base planetary label ${body}:${level}:${matchName}`,
    );
  }
  return index;
};

const translations = {};

for (const language of languages) {
  const bodyTranslations = {};

  for (const [body, bodyTargets] of Object.entries(targets)) {
    const labels = {};
    const targetsByLevel = new Map();
    for (const target of bodyTargets) {
      const levelTargets = targetsByLevel.get(target.level) ?? [];
      levelTargets.push(target);
      targetsByLevel.set(target.level, levelTargets);
    }

    for (const [level, levelTargets] of targetsByLevel) {
      const indexedTargets = levelTargets.map((target) => ({
        ...target,
        index: getBaseIndex(body, target.level, target.matchName),
      }));
      const datasetPath = getDatasetPath(body, level, language);
      if (!existsSync(join(root, datasetPath))) continue;
      const localizedNames = extractNamesAtIndexes(
        datasetPath,
        indexedTargets.map((target) => target.index),
      );

      for (const target of indexedTargets) {
        const localizedName = localizedNames[target.index];
        if (!localizedName) {
          throw new Error(
            `Missing localized label ${language}:${body}:${target.id}`,
          );
        }
        labels[target.id] = target.normalize
          ? target.normalize(localizedName)
          : localizedName;
      }
    }

    for (const target of bodyTargets) {
      const localizedName = labels[target.id];
      if (!localizedName) {
        throw new Error(
          `Missing localized label ${language}:${body}:${target.id}`,
        );
      }
    }

    Object.assign(
      labels,
      manualLabelOverrides[language]?.[body],
      missionFallbacks[language]?.[body],
    );
    bodyTranslations[body] = labels;
  }

  translations[language] = bodyTranslations;
}

const header = `// Generated by scripts/generate-planetary-landmark-labels.mjs.\n`;
const body = `export const PLANETARY_LANDMARK_LOCALIZED_LABELS: Record<
  string,
  { moon?: Record<string, string>; mars?: Record<string, string> }
> = ${JSON.stringify(translations, null, 2)};\n`;

writeFileSync(
  join(root, "apps/web/lib/map/planetary-landmark-labels.ts"),
  `${header}${body}`,
);
