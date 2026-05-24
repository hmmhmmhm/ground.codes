import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, test } from "node:test";

type Region3Row = {
  name: string;
  code: string;
  source?: string;
};

const require = createRequire(import.meta.url);

const readRows = (modulePath: string) =>
  JSON.parse(readFileSync(require.resolve(modulePath), "utf8")) as Region3Row[];

const region1Path = "@ground-codes/geoint/region-dist/region-1.json";

const region2PathByLanguage: Record<string, string> = {
  english: "@ground-codes/geoint/region-dist/region-2.json",
  korean: "@ground-codes/geoint/region-dist/region-2-korean.json",
  chinese: "@ground-codes/geoint/region-dist/region-2-chinese.json",
  japanese: "@ground-codes/geoint/region-dist/region-2-japanese.json",
  spanish: "@ground-codes/geoint/region-dist/region-2-spanish.json",
  french: "@ground-codes/geoint/region-dist/region-2-french.json",
  german: "@ground-codes/geoint/region-dist/region-2-german.json",
  portuguese: "@ground-codes/geoint/region-dist/region-2-portuguese.json",
  indonesian: "@ground-codes/geoint/region-dist/region-2-indonesian.json",
  thai: "@ground-codes/geoint/region-dist/region-2-thai.json",
  vietnamese: "@ground-codes/geoint/region-dist/region-2-vietnamese.json",
  hindi: "@ground-codes/geoint/region-dist/region-2-hindi.json",
  arabic: "@ground-codes/geoint/region-dist/region-2-arabic.json",
  russian: "@ground-codes/geoint/region-dist/region-2-russian.json",
};

const region3PathByLanguage: Record<string, string> = {
  english: "@ground-codes/geoint/region-dist/region-3.json",
  korean: "@ground-codes/geoint/region-dist/region-3-korean.json",
  chinese: "@ground-codes/geoint/region-dist/region-3-chinese.json",
  japanese: "@ground-codes/geoint/region-dist/region-3-japanese.json",
  spanish: "@ground-codes/geoint/region-dist/region-3-spanish.json",
  french: "@ground-codes/geoint/region-dist/region-3-french.json",
  german: "@ground-codes/geoint/region-dist/region-3-german.json",
  portuguese: "@ground-codes/geoint/region-dist/region-3-portuguese.json",
  indonesian: "@ground-codes/geoint/region-dist/region-3-indonesian.json",
  thai: "@ground-codes/geoint/region-dist/region-3-thai.json",
  vietnamese: "@ground-codes/geoint/region-dist/region-3-vietnamese.json",
  hindi: "@ground-codes/geoint/region-dist/region-3-hindi.json",
  arabic: "@ground-codes/geoint/region-dist/region-3-arabic.json",
  russian: "@ground-codes/geoint/region-dist/region-3-russian.json",
};

const languages = Object.keys(region3PathByLanguage);

const findRegionNameByCode = (rows: Region3Row[], code: string) =>
  rows.find((row) => row.code === code)?.name;

describe("region-3 dataset", () => {
  test("keeps English earth region names ASCII-only for readable URLs", () => {
    const englishDatasets: Array<[string, Region3Row[]]> = [
      ["region-1", readRows(region1Path)],
      ["region-2", readRows(region2PathByLanguage.english)],
      ["region-3", readRows(region3PathByLanguage.english)],
    ];
    const nonAsciiNames = englishDatasets.flatMap(([datasetName, rows]) =>
      rows
        .filter((row) => /[^\x20-\x7E]/.test(row.name))
        .map((row) => `${datasetName}:${row.name}`),
    );

    assert.deepEqual(nonAsciiNames, []);
  });

  test("keeps reviewed localized earth region names translated", () => {
    const region2Korean = readRows(region2PathByLanguage.korean);
    const region2Chinese = readRows(region2PathByLanguage.chinese);
    const region2Spanish = readRows(region2PathByLanguage.spanish);
    const region2French = readRows(region2PathByLanguage.french);
    const region2German = readRows(region2PathByLanguage.german);
    const region2Portuguese = readRows(region2PathByLanguage.portuguese);
    const region2Indonesian = readRows(region2PathByLanguage.indonesian);
    const region2Thai = readRows(region2PathByLanguage.thai);
    const region2Vietnamese = readRows(region2PathByLanguage.vietnamese);
    const region2Hindi = readRows(region2PathByLanguage.hindi);
    const region2Arabic = readRows(region2PathByLanguage.arabic);
    const region2Russian = readRows(region2PathByLanguage.russian);
    const region3Spanish = readRows(region3PathByLanguage.spanish);
    const region3French = readRows(region3PathByLanguage.french);
    const region3German = readRows(region3PathByLanguage.german);
    const region3Portuguese = readRows(region3PathByLanguage.portuguese);
    const region3Indonesian = readRows(region3PathByLanguage.indonesian);
    const region3Thai = readRows(region3PathByLanguage.thai);
    const region3Vietnamese = readRows(region3PathByLanguage.vietnamese);
    const region3Hindi = readRows(region3PathByLanguage.hindi);
    const region3Arabic = readRows(region3PathByLanguage.arabic);
    const region3Russian = readRows(region3PathByLanguage.russian);

    assert.equal(findRegionNameByCode(region2Korean, "1847050"), "애월");
    assert.equal(
      findRegionNameByCode(region2Korean, "1546102"),
      "포르토프랑세",
    );
    assert.equal(
      findRegionNameByCode(region2Chinese, "3018060"),
      "方丹弗朗塞斯",
    );
    assert.equal(findRegionNameByCode(region2Spanish, "1835848"), "Seul");
    assert.equal(findRegionNameByCode(region3Spanish, "OCN0"), "Mar Ross 1");
    assert.equal(findRegionNameByCode(region2French, "1835848"), "Seoul");
    assert.equal(findRegionNameByCode(region3French, "OCN0"), "Mer Ross 1");
    assert.equal(findRegionNameByCode(region2German, "1835848"), "Seoul");
    assert.equal(findRegionNameByCode(region2German, "2950159"), "Berlin");
    assert.equal(findRegionNameByCode(region3German, "OCN0"), "Rossmeer 1");
    assert.equal(findRegionNameByCode(region2Portuguese, "1835848"), "Seul");
    assert.equal(findRegionNameByCode(region2Portuguese, "2267057"), "Lisboa");
    assert.equal(
      findRegionNameByCode(region3Portuguese, "OCN0"),
      "Mar de Ross 1",
    );
    assert.equal(findRegionNameByCode(region2Indonesian, "1835848"), "Seoul");
    assert.equal(findRegionNameByCode(region2Indonesian, "1642911"), "Jakarta");
    assert.equal(
      findRegionNameByCode(region3Indonesian, "OCN0"),
      "Laut Ross 1",
    );
    assert.equal(findRegionNameByCode(region2Thai, "1609350"), "กรุงเทพมหานคร");
    assert.equal(findRegionNameByCode(region2Thai, "1835848"), "โซล");
    assert.equal(findRegionNameByCode(region3Thai, "OCN0"), "ทะเลรอสส์ 1");
    assert.equal(findRegionNameByCode(region2Vietnamese, "1581130"), "Hà Nội");
    assert.equal(
      findRegionNameByCode(region2Vietnamese, "1566083"),
      "TP Hồ Chí Minh",
    );
    assert.equal(findRegionNameByCode(region3Vietnamese, "OCN0"), "Biển Ross 1");
    assert.equal(findRegionNameByCode(region2Hindi, "1273294"), "दिल्ली");
    assert.equal(findRegionNameByCode(region2Hindi, "1261481"), "नईदिल्ली");
    assert.equal(findRegionNameByCode(region3Hindi, "OCN0"), "रॉस सागर 1");
    assert.equal(findRegionNameByCode(region2Arabic, "360630"), "القاهرة");
    assert.equal(findRegionNameByCode(region3Arabic, "OCN0"), "روس بحر 1");
    assert.equal(findRegionNameByCode(region2Russian, "524901"), "Москва");
    assert.equal(
      findRegionNameByCode(region2Russian, "498817"),
      "Санкт Петербург",
    );
    assert.equal(
      findRegionNameByCode(region3Russian, "OCN0"),
      "Море Росса 1",
    );

    assert.deepEqual(
      region2Korean
        .filter((row) => ["개그투리", "Portaux-Francais"].includes(row.name))
        .map((row) => row.name),
      [],
    );
    assert.deepEqual(
      region2Chinese
        .filter((row) => row.name === "FontaineFrancaise")
        .map((row) => row.name),
      [],
    );
  });

  test("keeps Japanese earth region names free of Latin fallback fragments", () => {
    const region2Japanese = readRows(region2PathByLanguage.japanese);

    assert.deepEqual(
      region2Japanese.filter((row) => /[A-Za-z]/.test(row.name)),
      [],
    );
  });

  for (const language of languages) {
    test(`${language} names are short, URL-safe, and unique`, () => {
      const rows = readRows(region3PathByLanguage[language]);
      const names = rows.map((row) => row.name);
      const normalizedNames = names.map((name) => name.toLowerCase());

      assert.equal(new Set(normalizedNames).size, rows.length);
      assert.equal(names.filter((name) => [...name].length > 20).length, 0);
      assert.equal(names.filter((name) => /[-/#?]/.test(name)).length, 0);
    });

    test(`${language} ocean grid names use decimal suffixes`, () => {
      const rows = readRows(region3PathByLanguage[language]);
      const oceanRows = rows.filter(
        (row) => row.source === "natural-earth-marine",
      );

      assert.ok(oceanRows.length > 0);
      assert.equal(
        oceanRows.filter((row) => !/ \d+$/.test(row.name)).length,
        0,
      );
    });

    test(`${language} antarctic grid names use decimal suffixes`, () => {
      const rows = readRows(region3PathByLanguage[language]);
      const antarcticGridRows = rows.filter(
        (row) => row.source === "synthetic-antarctic-grid",
      );

      assert.equal(antarcticGridRows.length, 900);
      assert.equal(
        antarcticGridRows.filter((row) => !/ \d+$/.test(row.name)).length,
        0,
      );
    });

    test(`${language} arctic grid names use decimal suffixes`, () => {
      const rows = readRows(region3PathByLanguage[language]);
      const arcticGridRows = rows.filter(
        (row) => row.source === "synthetic-arctic-grid",
      );

      assert.equal(arcticGridRows.length, 1800);
      assert.equal(
        arcticGridRows.filter((row) => !/ \d+$/.test(row.name)).length,
        0,
      );
    });

    test(`${language} sahara grid names use decimal suffixes`, () => {
      const rows = readRows(region3PathByLanguage[language]);
      const saharaGridRows = rows.filter(
        (row) => row.source === "synthetic-sahara-grid",
      );

      assert.equal(saharaGridRows.length, 351);
      assert.equal(
        saharaGridRows.filter((row) => !/ \d+$/.test(row.name)).length,
        0,
      );
    });

    test(`${language} named gap labels are present`, () => {
      const rows = readRows(region3PathByLanguage[language]);
      const namedGapRows = rows.filter(
        (row) => row.source === "synthetic-named-gap",
      );

      assert.equal(namedGapRows.length, 150);
    });

    test(`${language} named gap labels do not collide with lookup keys`, () => {
      const rows = readRows(region3PathByLanguage[language]);
      const namedGapRows = rows.filter(
        (row) => row.source === "synthetic-named-gap",
      );
      const existingKeys = new Set<string>();

      for (const row of [
        ...readRows(region1Path),
        ...readRows(region2PathByLanguage[language]),
        ...rows.filter((row) => row.source !== "synthetic-named-gap"),
      ]) {
        existingKeys.add(String(row.name ?? "").toLowerCase());
        existingKeys.add(String(row.code ?? "").toLowerCase());
      }

      assert.equal(
        namedGapRows.filter((row) => existingKeys.has(row.name.toLowerCase()))
          .length,
        0,
      );
    });
  }
});
