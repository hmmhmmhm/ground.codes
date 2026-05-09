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
import region3Chinese from "@ground-codes/geoint/region-dist/region-3-chinese.json";
// @ts-ignore
import region3English from "@ground-codes/geoint/region-dist/region-3.json";
// @ts-ignore
import region3Korean from "@ground-codes/geoint/region-dist/region-3-korean.json";

type Region3Row = {
  name: string;
  code: string;
  source?: string;
};

const datasets: Array<[string, Region3Row[]]> = [
  ["english", region3English],
  ["korean", region3Korean],
  ["chinese", region3Chinese],
];
const region2ByLanguage: Record<string, Region3Row[]> = {
  english: region2English,
  korean: region2Korean,
  chinese: region2Chinese,
};

describe("region-3 dataset", () => {
  for (const [language, rows] of datasets) {
    test(`${language} names are short, URL-safe, and unique`, () => {
      const names = rows.map((row) => row.name);
      const normalizedNames = names.map((name) => name.toLowerCase());

      assert.equal(new Set(normalizedNames).size, rows.length);
      assert.equal(
        names.filter((name) => [...name].length > 20).length,
        0,
      );
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
        namedGapRows.filter((row) =>
          existingKeys.has(row.name.toLowerCase()),
        ).length,
        0,
      );
    });
  }
});
