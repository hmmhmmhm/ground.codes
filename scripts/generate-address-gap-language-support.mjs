import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import {
  buildCodebook,
  codebookLanguages,
} from "./data/address-gap-codebook.mjs";
import {
  languageSpecs,
  webLocaleByLanguage,
} from "./data/address-gap-language-specs.mjs";

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

const normalizeRegionLabel = (value) =>
  String(value)
    .replace(/[’'`´/#?\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const truncateLabel = (value, maxLength) => {
  if ([...value].length <= maxLength) return value;

  const suffixMatch = value.match(/^(.*?)( \d+)$/);
  if (suffixMatch) {
    const [, head, suffix] = suffixMatch;
    const headLength = Math.max(1, maxLength - [...suffix].length);
    return `${[...head].slice(0, headLength).join("").trim()}${suffix}`;
  }

  return [...value].slice(0, maxLength).join("").trim();
};

const dedupeNames = (rows, maxLength) => {
  const seen = new Set();
  return rows.map((row) => {
    let base = normalizeRegionLabel(row.name);
    base = truncateLabel(base, maxLength);
    let candidate = base || String(row.code);
    let index = 2;
    while (seen.has(candidate.toLocaleLowerCase())) {
      const suffix = ` ${index}`;
      const trimmed = [...base]
        .slice(0, Math.max(1, maxLength - suffix.length))
        .join("")
        .trim();
      candidate = `${trimmed}${suffix}`;
      index += 1;
    }
    seen.add(candidate.toLocaleLowerCase());
    return { ...row, name: candidate };
  });
};

const translateName = (language, row) => {
  const spec = languageSpecs[language];
  return spec.overrides[String(row.code)] ?? spec.region(row.name);
};

const numericSuffixSources = new Set([
  "natural-earth-marine",
  "synthetic-antarctic-grid",
  "synthetic-arctic-grid",
  "synthetic-sahara-grid",
]);

const stableNumericSuffix = (row, index) => {
  const digits = String(row.code ?? "")
    .match(/\d+/g)
    ?.join("");
  return digits || String(index + 1);
};

const withRequiredSuffix = (row, index) => {
  if (numericSuffixSources.has(row.source) && !/ \d+$/.test(row.name)) {
    return {
      ...row,
      name: `${row.name} ${stableNumericSuffix(row, index)}`,
    };
  }

  if (row.source === "synthetic-named-gap") {
    return {
      ...row,
      name: `${row.name} ${stableNumericSuffix(row, index)}`,
    };
  }

  return row;
};

const buildLocalizedRows = (language, inputPath, outputPath, maxLength) => {
  const rows = readJson(inputPath).map((row, index) =>
    withRequiredSuffix(
      {
        ...row,
        name: translateName(language, row),
      },
      index,
    ),
  );
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

const mode = process.argv[2] ?? "all";
if (!["all", "codebook-only"].includes(mode)) {
  throw new Error(`Unsupported mode: ${mode}`);
}

for (const language of codebookLanguages) {
  writeJson(
    `packages/codebook/codebook-dist/${language}.json`,
    buildCodebook(language),
  );
  if (mode === "codebook-only") continue;

  const suffix = `-${language}`;
  buildLocalizedRows(
    language,
    "packages/geoint/region-dist/region-2.json",
    `packages/geoint/region-dist/region-2${suffix}.json`,
    36,
  );
  buildLocalizedRows(
    language,
    "packages/geoint/region-dist/region-3.json",
    `packages/geoint/region-dist/region-3${suffix}.json`,
    20,
  );
  buildLocalizedRows(
    language,
    "packages/geoint/region-dist/region-2-moon.json",
    `packages/geoint/region-dist/region-2-moon${suffix}.json`,
    48,
  );
  buildLocalizedRows(
    language,
    "packages/geoint/region-dist/region-2-mars.json",
    `packages/geoint/region-dist/region-2-mars${suffix}.json`,
    48,
  );
  buildLocalizedRows(
    language,
    "packages/geoint/region-dist/region-3-mars.json",
    `packages/geoint/region-dist/region-3-mars${suffix}.json`,
    48,
  );

  for (const regionName of [
    `region-2${suffix}`,
    `region-3${suffix}`,
    `region-2-moon${suffix}`,
    `region-2-mars${suffix}`,
    `region-3-mars${suffix}`,
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}

const englishMessages = readJson("apps/web/messages/en/index.json");
const englishPlaceTypes = readJson("apps/web/messages/en/placeTypes.json");
for (const [language, { locale, languageName }] of Object.entries(
  webLocaleByLanguage,
)) {
  const messagesDir = new URL(`apps/web/messages/${locale}/`, root);
  if (!existsSync(messagesDir)) mkdirSync(messagesDir, { recursive: true });
  writeJson(`apps/web/messages/${locale}/index.json`, {
    ...englishMessages,
    common: {
      ...englishMessages.common,
      languageName,
      languageCode: locale,
    },
  });
  writeJson(`apps/web/messages/${locale}/placeTypes.json`, englishPlaceTypes);
}
