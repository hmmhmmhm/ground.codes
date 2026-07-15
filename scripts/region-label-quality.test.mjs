import assert from "node:assert/strict";
import {
  existsSync,
  openSync,
  readFileSync,
  readSync,
  closeSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

import { assertMaterializedRegionData } from "./region-data/materialization.mjs";

assertMaterializedRegionData({ groups: ["region-dist"] });
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const readRows = (relativePath) =>
  JSON.parse(readFileSync(join(root, relativePath), "utf8"));

const readText = (relativePath) =>
  readFileSync(join(root, relativePath), "utf8");

const readPrefix = (relativePath, bytes = 4096) => {
  const file = openSync(join(root, relativePath), "r");
  try {
    const buffer = Buffer.alloc(bytes);
    const length = readSync(file, buffer, 0, bytes, 0);
    return buffer.subarray(0, length).toString("utf8");
  } finally {
    closeSync(file);
  }
};

const targetLanguageSpecs = JSON.parse(
  readFileSync(join(root, "config/language-expansion-targets.json"), "utf8"),
)
  .languages.filter((item) => item.language !== "english");

const targetLanguages = targetLanguageSpecs.map((item) => item.language);

const reviewedLabels = [
  ["packages/geoint/region-dist/region-3-hindi.json", "OCN0", "रॉस सागर 1"],
  ["packages/geoint/region-dist/region-3-thai.json", "OCN0", "ทะเลรอสส์ 1"],
  ["packages/geoint/region-dist/region-3-german.json", "OCN0", "Rossmeer 1"],
  [
    "packages/geoint/region-dist/region-3-portuguese.json",
    "OCN0",
    "Mar de Ross 1",
  ],
  ["packages/geoint/region-dist/region-3-arabic.json", "OCN0", "روس بحر 1"],
  ["packages/geoint/region-dist/region-3-russian.json", "OCN0", "Море Росса 1"],
];

const addressGapPlanetaryFallbackLanguages = [
  "acholi",
  "aymara",
  "bambara",
  "chichewa",
  "dagbani",
  "dinka",
  "ewe",
  "filipino",
  "fon",
  "fula",
  "guarani",
  "hausa",
  "kanuri",
  "kinyarwanda",
  "kirundi",
  "kongo",
  "krio",
  "lingala",
  "luganda",
  "malagasy",
  "moore",
  "ndebele",
  "nuer",
  "oromo",
  "quechua",
  "sango",
  "shona",
  "somali",
  "songhay",
  "swahili",
  "tamasheq",
  "tok_pisin",
  "twi",
  "wolof",
  "zarma",
];

const reviewedMoonGenericFallbackLabels = [
  "Bay",
  "Taurus Littrow Valley",
  "Stone Mountain",
  "Bear Mountain",
  "Family Mountain",
  "Plain",
  "Mount Marilyn",
];

const reviewedMarsPrefixFallbackLabels = [
  "Hephaestus Rupes",
  "Electris Mons",
  "Eridania Mons",
  "Sirenum Mons",
  "Valles Marineris",
  "Aurorae Sinus",
  "Aeolis Palus",
  "Aonium Sinus",
  "Copais Palus",
  "Deltoton Sinus",
  "Ismenius Lacus",
  "Lunae Palus",
  "Niliacus Lacus",
  "Margaritifer Sinus",
  "Moeris Lacus",
  "Oxia Palus",
  "Phoenicis Lacus",
  "Promethei Sinus",
  "Sithonius Lacus",
  "Solis Lacus",
  "Tithonius Lacus",
];

const prefixedNamePattern = (labels) =>
  new RegExp(
    `"name": "[A-Z]{2} (${labels
      .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})"`,
  );

describe("region label quality audit", () => {
  test("keeps reviewed multilingual ocean labels stable", () => {
    for (const [dataset, code, expectedName] of reviewedLabels) {
      const row = readRows(dataset).find(
        (candidate) => candidate.code === code,
      );

      assert.equal(row?.name, expectedName, `${dataset}:${code}`);
    }
  });

  test("keeps non-Latin reviewed region datasets free of URL separators", () => {
    for (const dataset of [
      "packages/geoint/region-dist/region-2-hindi.json",
      "packages/geoint/region-dist/region-3-hindi.json",
      "packages/geoint/region-dist/region-2-thai.json",
      "packages/geoint/region-dist/region-3-thai.json",
      "packages/geoint/region-dist/region-2-arabic.json",
      "packages/geoint/region-dist/region-3-arabic.json",
      "packages/geoint/region-dist/region-2-russian.json",
      "packages/geoint/region-dist/region-3-russian.json",
      "packages/geoint/region-dist/region-3-japanese.json",
      "packages/geoint/region-dist/region-3-chinese.json",
    ]) {
      const unsafe = readRows(dataset)
        .filter((row) => /[-/#?]/.test(row.name))
        .slice(0, 10);

      assert.deepEqual(unsafe, [], dataset);
    }
  });

  test("keeps every expanded region-3 ocean label localized", () => {
    const missing = [];
    const englishFallbacks = [];

    for (const language of targetLanguages) {
      const dataset = `packages/geoint/region-dist/region-3-${language}.json`;
      if (!existsSync(join(root, dataset))) {
        missing.push(language);
        continue;
      }

      const prefix = readPrefix(dataset);
      if (
        !prefix.includes('"code":"OCN0"') &&
        !prefix.includes('"code": "OCN0"')
      ) {
        missing.push(`${language}:OCN0`);
      }
      if (
        prefix.includes('"name":"Ross Sea 1"') ||
        prefix.includes('"name": "Ross Sea 1"')
      ) {
        englishFallbacks.push(language);
      }
    }

    assert.deepEqual(missing, []);
    assert.deepEqual(englishFallbacks, []);
  });

  test("keeps reviewed planetary landmark labels localized", () => {
    const englishFallbacks = [];

    for (const language of addressGapPlanetaryFallbackLanguages) {
      const marsDataset = `packages/geoint/region-dist/region-2-mars-${language}.json`;
      const moonDataset = `packages/geoint/region-dist/region-2-moon-${language}.json`;

      if (readText(marsDataset).includes('"name": "Olympus Mons"')) {
        englishFallbacks.push(`${language}:Olympus Mons`);
      }
      if (readText(moonDataset).includes('"name": "Mare Tranquillitatis"')) {
        englishFallbacks.push(`${language}:Mare Tranquillitatis`);
      }
    }

    assert.deepEqual(englishFallbacks, []);
  });

  test("keeps reviewed moon generic terrain labels localized", () => {
    const englishFallbacks = [];

    for (const language of addressGapPlanetaryFallbackLanguages) {
      const moonDataset = `packages/geoint/region-dist/region-2-moon-${language}.json`;
      const text = readText(moonDataset);

      for (const label of reviewedMoonGenericFallbackLabels) {
        if (text.includes(`"name": "${label}"`)) {
          englishFallbacks.push(`${language}:${label}`);
        }
      }
    }

    assert.deepEqual(englishFallbacks, []);
  });

  test("keeps reviewed moon generic terrain labels free of locale prefixes", () => {
    const prefixedFallbacks = [];
    const prefixedLabelPattern = prefixedNamePattern(
      reviewedMoonGenericFallbackLabels,
    );

    for (const language of targetLanguages) {
      const moonDataset = `packages/geoint/region-dist/region-2-moon-${language}.json`;
      if (!existsSync(join(root, moonDataset))) {
        continue;
      }

      if (prefixedLabelPattern.test(readText(moonDataset))) {
        prefixedFallbacks.push(language);
      }
    }

    assert.deepEqual(prefixedFallbacks, []);
  });

  test("keeps reviewed Mars landmark labels free of locale prefixes", () => {
    const prefixedFallbacks = [];
    const prefixedLabelPattern = prefixedNamePattern(
      reviewedMarsPrefixFallbackLabels,
    );

    for (const language of targetLanguages) {
      const marsDataset = `packages/geoint/region-dist/region-2-mars-${language}.json`;
      if (!existsSync(join(root, marsDataset))) {
        continue;
      }

      if (prefixedLabelPattern.test(readText(marsDataset))) {
        prefixedFallbacks.push(language);
      }
    }

    assert.deepEqual(prefixedFallbacks, []);
  });

  test("keeps region labels free of generated locale-prefix scaffolds", () => {
    const prefixedScaffoldFiles = [];
    const checkedDatasets = [
      "region-2",
      "region-2-mars",
      "region-2-moon",
      "region-3-mars",
      "region-3",
    ];

    for (const spec of targetLanguageSpecs) {
      const prefix = String(spec.locale ?? spec.iso6391 ?? spec.language)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
      if (!/^[A-Z]{2,3}$/.test(prefix)) {
        continue;
      }

      const prefixPattern = new RegExp(
        `"name"\\s*:\\s*"${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`,
        "g",
      );

      for (const datasetName of checkedDatasets) {
        const dataset = `packages/geoint/region-dist/${datasetName}-${spec.language}.json`;
        if (!existsSync(join(root, dataset))) {
          continue;
        }

        const prefixedCount =
          readPrefix(dataset, 1024 * 1024).match(prefixPattern)?.length ?? 0;

        if (prefixedCount > 1) {
          prefixedScaffoldFiles.push(
            `${datasetName}-${spec.language}:${prefixedCount}`,
          );
        }
      }
    }

    assert.deepEqual(prefixedScaffoldFiles, []);
  });
});
