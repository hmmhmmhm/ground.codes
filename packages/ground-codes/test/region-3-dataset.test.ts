import assert from "node:assert/strict";
import { describe, test } from "node:test";

// @ts-ignore
import region1 from "@ground-codes/geoint/region-dist/region-1.json";
// @ts-ignore
import region2Chinese from "@ground-codes/geoint/region-dist/region-2-chinese.json";
// @ts-ignore
import region2English from "@ground-codes/geoint/region-dist/region-2.json";
// @ts-ignore
import region2Korean from "@ground-codes/geoint/region-dist/region-2-korean.json";
// @ts-ignore
import region2Japanese from "@ground-codes/geoint/region-dist/region-2-japanese.json";
// @ts-ignore
import region3Chinese from "@ground-codes/geoint/region-dist/region-3-chinese.json";
// @ts-ignore
import region3English from "@ground-codes/geoint/region-dist/region-3.json";
// @ts-ignore
import region3Korean from "@ground-codes/geoint/region-dist/region-3-korean.json";
// @ts-ignore
import region3Japanese from "@ground-codes/geoint/region-dist/region-3-japanese.json";

type Region3Row = {
  name: string;
  code: string;
  source?: string;
};

const datasets: Array<[string, Region3Row[]]> = [
  ["english", region3English],
  ["korean", region3Korean],
  ["chinese", region3Chinese],
  ["japanese", region3Japanese],
];
const region2ByLanguage: Record<string, Region3Row[]> = {
  english: region2English,
  korean: region2Korean,
  chinese: region2Chinese,
  japanese: region2Japanese,
};

const englishDatasets: Array<[string, Region3Row[]]> = [
  ["region-1", region1],
  ["region-2", region2English],
  ["region-3", region3English],
];

const findRegionNameByCode = (rows: Region3Row[], code: string) =>
  rows.find((row) => row.code === code)?.name;

describe("region-3 dataset", () => {
  test("keeps English earth region names ASCII-only for readable URLs", () => {
    const nonAsciiNames = englishDatasets.flatMap(([datasetName, rows]) =>
      rows
        .filter((row) => /[^\x20-\x7E]/.test(row.name))
        .map((row) => `${datasetName}:${row.name}`),
    );

    assert.deepEqual(nonAsciiNames, []);
  });

  test("keeps reviewed localized earth region names translated", () => {
    assert.equal(findRegionNameByCode(region2Korean, "1847050"), "애월");
    assert.equal(
      findRegionNameByCode(region2Korean, "1546102"),
      "포르토프랑세",
    );
    assert.equal(
      findRegionNameByCode(region2Chinese, "3018060"),
      "方丹弗朗塞斯",
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
    assert.deepEqual(
      region2Japanese.filter((row) => /[A-Za-z]/.test(row.name)),
      [],
    );
  });

  for (const [language, rows] of datasets) {
    test(`${language} names are short, URL-safe, and unique`, () => {
      const names = rows.map((row) => row.name);
      const normalizedNames = names.map((name) => name.toLowerCase());

      assert.equal(new Set(normalizedNames).size, rows.length);
      assert.equal(names.filter((name) => [...name].length > 20).length, 0);
      assert.equal(names.filter((name) => /[-/#?]/.test(name)).length, 0);
    });

    test(`${language} ocean grid names use decimal suffixes`, () => {
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
      const namedGapRows = rows.filter(
        (row) => row.source === "synthetic-named-gap",
      );

      assert.equal(namedGapRows.length, 150);
    });

    test(`${language} named gap labels do not collide with lookup keys`, () => {
      const namedGapRows = rows.filter(
        (row) => row.source === "synthetic-named-gap",
      );
      const existingKeys = new Set<string>();

      for (const row of [
        ...region1,
        ...region2ByLanguage[language],
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
