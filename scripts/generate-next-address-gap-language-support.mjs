import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { buildCodebook } from "./data/next-address-codebook-builder.mjs";
import { languages } from "./data/next-address-languages.mjs";

const root = new URL("../", import.meta.url);
const geointRequire = createRequire(
  new URL("../packages/geoint/", import.meta.url),
);
const { default: KDBush } = await import(geointRequire.resolve("kdbush"));
const { Level } = await import(geointRequire.resolve("level"));

const shouldRegisterSourceFiles = process.argv.includes("--register");

const readText = (filePath) => readFileSync(new URL(filePath, root), "utf8");
const writeText = (filePath, value) =>
  writeFileSync(new URL(filePath, root), value);
const readJson = (filePath) => JSON.parse(readText(filePath));
const writeJson = (filePath, value) =>
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);

const shouldBuildEmbeddedDb = process.argv.includes("--db");

const regionTerms = {
  latin: [
    ["Ocean", "Ocean"],
    ["Sea", "Sea"],
    ["Bay", "Bay"],
    ["Gulf", "Gulf"],
    ["Lake", "Lake"],
    ["River", "River"],
  ],
  cyrillic: [
    ["Ocean", "Далай"],
    ["Sea", "Тэнгис"],
    ["Bay", "Булан"],
    ["Gulf", "Булан"],
    ["Lake", "Нуур"],
    ["River", "Гол"],
  ],
  lao: [
    ["Ocean", "ມະຫາສະໝຸດ"],
    ["Sea", "ທະເລ"],
    ["Bay", "ອ່າວ"],
    ["Gulf", "ອ່າວ"],
    ["Lake", "ໜອງ"],
    ["River", "ແມ່ນໍ້າ"],
  ],
  arabic: [
    ["Ocean", "اقیانوس"],
    ["Sea", "دریا"],
    ["Bay", "خلیج"],
    ["Gulf", "خلیج"],
    ["Lake", "دریاچه"],
    ["River", "رود"],
  ],
  ethiopic: [
    ["Ocean", "ባሕሪ"],
    ["Sea", "ባሕሪ"],
    ["Bay", "ገማግም"],
    ["Gulf", "ገማግም"],
    ["Lake", "ሓጽቢ"],
    ["River", "ሩባ"],
  ],
  sinhala: [
    ["Ocean", "සාගරය"],
    ["Sea", "මුහුද"],
    ["Bay", "බොක්ක"],
    ["Gulf", "බොක්ක"],
    ["Lake", "වැව"],
    ["River", "ගඟ"],
  ],
  tamil: [
    ["Ocean", "பெருங்கடல்"],
    ["Sea", "கடல்"],
    ["Bay", "வளைகுடா"],
    ["Gulf", "வளைகுடா"],
    ["Lake", "ஏரி"],
    ["River", "ஆறு"],
  ],
};

const translateRegionName = (spec, row) => {
  const overrides = {
    1642911: {
      mongolian: "Жакарта",
      lao: "ຈາກາຕາ",
      dari: "جاکارتا",
      tigrinya: "ጃካርታ",
      sinhala: "ජකර්තා",
      tamil: "ஜகார்த்தா",
    },
    1835848: {
      mongolian: "Сөүл",
      lao: "ໂຊລ",
      dari: "سئول",
      tigrinya: "ሰዉል",
      sinhala: "සෝල්",
      tamil: "சோல்",
    },
    1273294: {
      mongolian: "Дели",
      lao: "ເດລີ",
      dari: "دهلی",
      tigrinya: "ደሊ",
      sinhala: "දිල්ලි",
      tamil: "டெல்லி",
    },
    360630: {
      mongolian: "Каир",
      lao: "ໄຄໂຣ",
      dari: "قاهره",
      tigrinya: "ካይሮ",
      sinhala: "කයිරෝ",
      tamil: "கெய்ரோ",
    },
  };
  const override = overrides[String(row.code)]?.[spec.language];
  if (override) return override;

  let name = foldLatin(row.name);
  for (const [from, to] of regionTerms[spec.script] ?? regionTerms.latin) {
    name = name.replace(new RegExp(`\\b${from}\\b`, "g"), to);
  }
  return spec.script === "latin" ? name : transliterate(name, spec.script);
};

const numericSuffixSources = new Set([
  "natural-earth-marine",
  "synthetic-antarctic-grid",
  "synthetic-arctic-grid",
  "synthetic-sahara-grid",
]);

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
    return `${[...head]
      .slice(0, Math.max(1, maxLength - suffix.length))
      .join("")
      .trim()}${suffix}`;
  }
  return [...value].slice(0, maxLength).join("").trim();
};

const localizedRows = (spec, inputPath, maxLength) => {
  const seen = new Set();
  return readJson(inputPath).map((row, index) => {
    const suffixSource =
      numericSuffixSources.has(row.source) ||
      row.source === "synthetic-named-gap";
    const suffix =
      String(row.code ?? "")
        .match(/\d+/g)
        ?.join("") || String(index + 1);
    let name = translateRegionName(spec, row);
    if (suffixSource && !/ \d+$/.test(name)) name = `${name} ${suffix}`;
    let base = truncateLabel(normalizeRegionLabel(name), maxLength);
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

for (const spec of languages) {
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

  if (shouldBuildEmbeddedDb) {
    for (const regionName of [
      `region-2-${spec.language}`,
      `region-3-${spec.language}`,
      `region-2-moon-${spec.language}`,
      `region-2-mars-${spec.language}`,
      `region-3-mars-${spec.language}`,
    ]) {
      await buildEmbeddedRegionDb(regionName);
    }
  }
}

const englishMessages = readJson("apps/web/messages/en/index.json");
const englishPlaceTypes = readJson("apps/web/messages/en/placeTypes.json");
for (const spec of languages) {
  const messagesDir = new URL(`apps/web/messages/${spec.locale}/`, root);
  if (!existsSync(messagesDir)) mkdirSync(messagesDir, { recursive: true });
  writeJson(`apps/web/messages/${spec.locale}/index.json`, {
    ...englishMessages,
    common: {
      ...englishMessages.common,
      languageName: spec.label,
      languageCode: spec.locale,
    },
  });
  writeJson(
    `apps/web/messages/${spec.locale}/placeTypes.json`,
    englishPlaceTypes,
  );
}

const replaceOnce = (filePath, from, to) => {
  const source = readText(filePath);
  if (!source.includes(from)) throw new Error(`${filePath}: pattern not found`);
  writeText(filePath, source.replace(from, to));
};

const languageLines = languages
  .map((item) => `  "${item.language}",`)
  .join("\n");
const localeLines = languages.map((item) => `  "${item.locale}",`).join("\n");

if (shouldRegisterSourceFiles) {
  replaceOnce(
    "apps/api-ground-codes/src/endpoints/v1/language.ts",
    '  "lingala",\n] as const;',
    `  "lingala",\n${languageLines}\n] as const;`,
  );

  replaceOnce(
    "packages/ground-codes/src/wordset-language.ts",
    '  | "lingala";',
    `  | "lingala"\n${languages.map((item) => `  | "${item.language}"`).join("\n")};`,
  );
  replaceOnce(
    "packages/ground-codes/src/wordset-language.ts",
    "  lingala: 5000,\n};",
    `  lingala: 5000,\n${languages.map((item) => `  ${item.language}: 5000,`).join("\n")}\n};`,
  );
  replaceOnce(
    "packages/ground-codes/src/wordset-loader-secondary.ts",
    "  }\n\n  return null;\n};",
    `  }${languages.map((item) => ` else if (language.toLowerCase() === "${item.language}") {\n    // @ts-ignore\n    return (await import("@repo/codebook/codebook-dist/${item.language}.json"))\n      .default as string[];`).join("\n  }")}\n  }\n\n  return null;\n};`,
  );

  replaceOnce(
    "apps/web/i18n.ts",
    '  "ln",\n] as const;',
    `  "ln",\n${localeLines}\n] as const;`,
  );
  replaceOnce(
    "apps/web/lib/i18n/ground-code-language.ts",
    '  if (locale === "ln") return "lingala";\n  return "english";',
    `  if (locale === "ln") return "lingala";\n${languages.map((item) => `  if (locale === "${item.locale}") return "${item.language}";`).join("\n")}\n  return "english";`,
  );

  replaceOnce(
    "apps/web/components/google-map/map-control-labels.ts",
    '  ln: "Lingála",\n};',
    `  ln: "Lingála",\n${languages.map((item) => `  ${item.locale}: "${item.label}",`).join("\n")}\n};`,
  );
  replaceOnce(
    "apps/web/components/google-map/map-control-labels.ts",
    '  ln: "LN",\n};',
    `  ln: "LN",\n${languages.map((item) => `  ${item.locale}: "${item.short}",`).join("\n")}\n};`,
  );

  replaceOnce(
    "apps/web/components/google-map/place-details/types.ts",
    'import lnPlaceTypes from "@/messages/ln/placeTypes.json";',
    `import lnPlaceTypes from "@/messages/ln/placeTypes.json";\n${languages.map((item) => `import ${item.locale}PlaceTypes from "@/messages/${item.locale}/placeTypes.json";`).join("\n")}`,
  );
  replaceOnce(
    "apps/web/components/google-map/place-details/types.ts",
    "  ln: lnPlaceTypes as PlaceTypesRecord,\n};",
    `  ln: lnPlaceTypes as PlaceTypesRecord,\n${languages.map((item) => `  ${item.locale}: ${item.locale}PlaceTypes as PlaceTypesRecord,`).join("\n")}\n};`,
  );

  replaceOnce(
    "packages/ground-codes/src/region-languages.ts",
    '  "lingala",\n]);',
    `  "lingala",\n${languageLines}\n]);`,
  );
  replaceOnce(
    "packages/ground-codes/src/region-languages.ts",
    '  "lingala",\n]);\n\nexport const englishRegionFallbackLanguages',
    `  "lingala",\n${languageLines}\n]);\n\nexport const englishRegionFallbackLanguages`,
  );

  replaceOnce(
    "scripts/language-support-completeness.test.mjs",
    '  "lingala",\n];',
    `  "lingala",\n${languageLines}\n];`,
  );
  replaceOnce(
    "scripts/address-gap-codebook-quality.test.mjs",
    '  "lingala",\n];',
    `  "lingala",\n${languageLines}\n];`,
  );
}

console.log(
  `Generated ${languages.length} address-gap language support bundles.`,
);
